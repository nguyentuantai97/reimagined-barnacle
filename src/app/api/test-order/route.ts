import { NextResponse } from 'next/server';
import { getCukcukToken, getCukcukBaseUrl } from '@/lib/cukcuk/auth';
import { fetchCukcukBranches } from '@/lib/cukcuk/client';

export async function GET() {
  try {
    // Test 1: Get token
    console.log('=== Test 1: Getting CUKCUK Token ===');
    const { accessToken, companyCode } = await getCukcukToken();
    console.log('Token:', accessToken.substring(0, 20) + '...');
    console.log('CompanyCode:', companyCode);

    // Test 2: Get branches
    console.log('\n=== Test 2: Getting Branches ===');
    const branchResult = await fetchCukcukBranches();
    console.log('Branches:', JSON.stringify(branchResult, null, 2));

    if (!branchResult.success || !branchResult.data?.length) {
      return NextResponse.json({
        success: false,
        error: 'No branches found',
        branchResult,
      });
    }

    const branchId = branchResult.data[0].Id;

    // Test 3: Create test order
    console.log('\n=== Test 3: Creating Test Order ===');
    const baseUrl = getCukcukBaseUrl();

    // Use exact format from CUKCUK API documentation - PaymentStatus is REQUIRED
    const orderRequest = {
      OrderType: 0, // 0 = delivery
      BranchId: branchId,
      CustomerName: 'Test Debug',
      CustomerTel: '0976257223',
      ShippingAddress: '112 Hoàng Phan Thái, Bình Chánh, Hồ Chí Minh',
      ShippingTimeType: 0, // 0 = immediate
      OrderNote: 'Test order from debug endpoint',
      PaymentStatus: 1, // REQUIRED: 1 = unpaid, 2 = paid
      TotalAmount: 25000,
      Amount: 25000,
      DeliveryAmount: 0,
      DiscountAmount: 0,
      OrderSource: 1, // 1 = restaurant website
      OrderItems: [
        {
          Id: '7fe310e5-0f92-4de8-9054-393116d2eedf',
          Code: 'YVQ',
          ItemType: 6,
          Name: 'Yogurt Việt Quất',
          Price: 25000,
          UnitID: '712e08f9-7008-4eac-b655-7572f70ded79',
          UnitName: 'Ly',
          Quantity: 1,
        },
      ],
    };

    console.log('Order Request:', JSON.stringify(orderRequest, null, 2));

    const response = await fetch(`${baseUrl}/api/v1/order-onlines/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        CompanyCode: companyCode,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequest),
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return NextResponse.json({
      success: true,
      token: {
        accessToken: accessToken.substring(0, 30) + '...',
        companyCode,
      },
      branches: branchResult.data,
      orderRequest,
      orderResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      },
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
