import { getCukcukToken, getCukcukBaseUrl, clearTokenCache } from './auth';
import {
  CUKCUK_ERROR_TYPES,
  CukcukInventoryItem,
  CukcukInventoryCategory,
  CukcukInventoryListResponse,
  CukcukCategoryListResponse,
  CukcukBranch,
  CukcukBranchListResponse,
  CukcukOrderOnlineRequest,
  CukcukOrderOnlineItem,
  CukcukOrderOnlineAddition,
  CukcukOrderOnlineResponse,
} from './types';
import { OrderItem, CustomerInfo } from '@/types';

// Fixed Branch ID from CUKCUK order-online URL
const CUKCUK_BRANCH_ID = '0b3b0c76-4594-41bc-b13b-f3cd1d3bfe02';

/**
 * Fetch branches from CUKCUK
 * Uses GET /api/v1/branchs/all endpoint
 */
export async function fetchCukcukBranches(): Promise<{
  success: boolean;
  data?: CukcukBranch[];
  error?: string;
}> {
  try {
    const { accessToken, companyCode } = await getCukcukToken();
    const baseUrl = getCukcukBaseUrl();

    const response = await fetch(`${baseUrl}/api/v1/branchs/all`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        CompanyCode: companyCode,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTokenCache();
      }
      throw new Error(`CUKCUK API error: ${response.status}`);
    }

    const data: CukcukBranchListResponse = await response.json();

    if (!data.Success) {
      throw new Error(data.Message || `CUKCUK error type: ${data.ErrorType}`);
    }

    return {
      success: true,
      data: data.Data || [],
    };
  } catch (error) {
    console.error('CUKCUK fetch branches failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the branch ID - using fixed ID from CUKCUK order-online URL
 */
function getDefaultBranchId(): string {
  return CUKCUK_BRANCH_ID;
}

type OrderType = 'delivery' | 'pickup';

/**
 * Create an online order in CUKCUK POS system
 * Uses POST /api/v1/order-onlines/create endpoint
 * This will sync to CUKCUK PC and trigger automatic bill/label printing
 *
 * @param orderType 'delivery' = giao hàng, 'pickup' = đến lấy tại quán
 */
export async function createCukcukOrder(
  orderNo: string,
  customer: CustomerInfo,
  items: OrderItem[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  orderType: OrderType = 'delivery'
): Promise<{ success: boolean; orderCode?: string; error?: string }> {
  try {
    const { accessToken, companyCode } = await getCukcukToken();
    const branchId = getDefaultBranchId();

    // Format order items for CUKCUK Online Orders API
    const orderItems: CukcukOrderOnlineItem[] = items.map((item) => {
      // Build note from options (Ngọt, Đá, etc.)
      const optionDescriptions: string[] = [];
      const additions: CukcukOrderOnlineAddition[] = [];

      item.options.forEach((opt) => {
        // Topping với giá > 0 -> thêm vào Additions
        if (opt.optionId === 'topping' && opt.priceAdjustment > 0) {
          // Extract cukcukId from choiceId if available (format: topping-{cukcukId})
          const toppingId = opt.choiceId.replace('topping-', '');
          additions.push({
            Id: toppingId,
            Description: opt.choiceName,
            Price: opt.priceAdjustment,
            Quantity: 1,
          });
        }
        // Các option khác (không phải "Không") -> thêm vào note
        else if (!opt.choiceName.toLowerCase().includes('không')) {
          // Format: "Ngọt: 70%", "Đá: Đá riêng", etc.
          optionDescriptions.push(`${opt.optionName}: ${opt.choiceName}`);
        }
      });

      const note = [...optionDescriptions, item.note].filter(Boolean).join(' | ');

      // Use correct CUKCUK API field names
      return {
        Id: item.cukcukId,
        Code: item.cukcukCode,
        ItemType: item.cukcukItemType,
        Name: item.name,
        Price: item.price,
        UnitID: item.cukcukUnitId,
        UnitName: item.cukcukUnitName,
        Note: note,
        Quantity: item.quantity,
        Additions: additions.length > 0 ? additions : undefined,
      };
    });

    // Determine CUKCUK OrderType: 0 = delivery, 1 = takeaway (pickup)
    const cukcukOrderType = orderType === 'pickup' ? 1 : 0;
    const isDelivery = orderType === 'delivery';

    // Build shipping address with Google Maps link for shipper navigation
    let shippingAddress = '';
    let mapsLink = '';
    if (isDelivery && customer.address) {
      shippingAddress = customer.address;
      if (customer.latitude && customer.longitude) {
        mapsLink = `https://maps.google.com/?q=${customer.latitude},${customer.longitude}`;
        shippingAddress += ` | Maps: ${mapsLink}`;
      }
    } else {
      shippingAddress = 'Đến lấy tại quán';
    }

    // Build order note - include pickup info if applicable
    let orderNote = customer.note || '';
    if (!isDelivery) {
      orderNote = orderNote
        ? `[ĐẾN LẤY] ${orderNote}`
        : '[ĐẾN LẤY TẠI QUÁN]';
    }

    // Create online order request
    const orderRequest: CukcukOrderOnlineRequest = {
      BranchId: branchId,
      OrderType: cukcukOrderType, // 0 = delivery, 1 = takeaway
      OrderCode: orderNo,
      CustomerName: customer.name,
      CustomerTel: customer.phone,
      ShippingAddress: shippingAddress,
      ShippingDueDate: new Date().toISOString(),
      OrderNote: orderNote,
      PaymentStatus: 1, // 1 = unpaid (COD)
      OrderSource: 1, // 1 = restaurant website
      Amount: subtotal,
      TotalAmount: total,
      DeliveryAmount: deliveryFee,
      DiscountAmount: 0,
      TaxAmount: 0,
      DepositAmount: 0,
      OrderItems: orderItems,
    };

    // Log order request for debugging
    console.log('[CUKCUK] Order Request:', JSON.stringify(orderRequest, null, 2));

    const baseUrl = getCukcukBaseUrl();
    const apiUrl = `${baseUrl}/api/v1/order-onlines/create`;
    console.log('[CUKCUK] API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        CompanyCode: companyCode,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequest),
    });

    const responseText = await response.text();
    console.log('[CUKCUK] Response Status:', response.status);
    console.log('[CUKCUK] Response Body:', responseText);

    if (!response.ok) {
      if (response.status === 401) {
        clearTokenCache();
      }
      throw new Error(`CUKCUK API error: ${response.status} - ${responseText}`);
    }

    const data: CukcukOrderOnlineResponse = JSON.parse(responseText);

    if (!data.Success) {
      if (data.ErrorType === CUKCUK_ERROR_TYPES.DUPLICATE_REQUEST) {
        console.warn('CUKCUK duplicate request detected');
        return { success: true, orderCode: orderNo };
      }

      throw new Error(data.Message || `CUKCUK error type: ${data.ErrorType}`);
    }

    return {
      success: true,
      orderCode: data.Data || orderNo,
    };
  } catch (error) {
    console.error('CUKCUK order creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if CUKCUK integration is configured
 */
export function isCukcukConfigured(): boolean {
  return Boolean(process.env.CUKCUK_DOMAIN && process.env.CUKCUK_SECRET_KEY);
}

/**
 * Fetch inventory items (menu products) from CUKCUK
 * Uses POST /api/v1/inventoryitems/paging endpoint
 */
export async function fetchCukcukInventoryItems(): Promise<{
  success: boolean;
  data?: CukcukInventoryItem[];
  error?: string;
}> {
  try {
    const { accessToken, companyCode } = await getCukcukToken();
    const baseUrl = getCukcukBaseUrl();

    // Use paging endpoint with POST method
    const requestBody = {
      Page: 1,
      Limit: 100, // Max 100 items per page
      IncludeInactive: false,
    };

    const response = await fetch(`${baseUrl}/api/v1/inventoryitems/paging`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        CompanyCode: companyCode,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearTokenCache();
      }
      throw new Error(`CUKCUK API error: ${response.status}`);
    }

    const data: CukcukInventoryListResponse = await response.json();

    if (!data.Success) {
      throw new Error(data.Message || `CUKCUK error type: ${data.ErrorType}`);
    }

    return {
      success: true,
      data: data.Data || [],
    };
  } catch (error) {
    console.error('CUKCUK fetch inventory failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch inventory categories from CUKCUK
 * Uses GET /api/v1/categories/list endpoint
 */
export async function fetchCukcukCategories(): Promise<{
  success: boolean;
  data?: CukcukInventoryCategory[];
  error?: string;
}> {
  try {
    const { accessToken, companyCode } = await getCukcukToken();
    const baseUrl = getCukcukBaseUrl();

    const response = await fetch(
      `${baseUrl}/api/v1/categories/list?includeInactive=false`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          CompanyCode: companyCode,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        clearTokenCache();
      }
      throw new Error(`CUKCUK API error: ${response.status}`);
    }

    const data: CukcukCategoryListResponse = await response.json();

    if (!data.Success) {
      throw new Error(data.Message || `CUKCUK error type: ${data.ErrorType}`);
    }

    return {
      success: true,
      data: data.Data || [],
    };
  } catch (error) {
    console.error('CUKCUK fetch categories failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch complete menu from CUKCUK (items + categories)
 */
export async function fetchCukcukMenu(): Promise<{
  success: boolean;
  items?: CukcukInventoryItem[];
  categories?: CukcukInventoryCategory[];
  error?: string;
}> {
  const [itemsResult, categoriesResult] = await Promise.all([
    fetchCukcukInventoryItems(),
    fetchCukcukCategories(),
  ]);

  if (!itemsResult.success || !categoriesResult.success) {
    return {
      success: false,
      error: itemsResult.error || categoriesResult.error,
    };
  }

  return {
    success: true,
    items: itemsResult.data,
    categories: categoriesResult.data,
  };
}
