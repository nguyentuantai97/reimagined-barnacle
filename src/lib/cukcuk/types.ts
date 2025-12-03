// CUKCUK API Types

export interface CukcukLoginParams {
  Domain: string;
  AppID: string;
  LoginTime: string;
}

export interface CukcukLoginRequest extends CukcukLoginParams {
  SignatureInfo: string;
}

export interface CukcukLoginResponse {
  Success: boolean;
  ErrorType: number;
  Data?: {
    AccessToken: string;
    CompanyCode: string;
  };
  Message?: string;
}

// Error Types
export const CUKCUK_ERROR_TYPES = {
  INVALID_PARAMS: 1,
  INTERNAL_ERROR: 100,
  DUPLICATE_REQUEST: 102,
} as const;

// Inventory Item types (from /api/v1/inventoryitems/paging)
export interface CukcukInventoryItem {
  Id: string;
  Code: string;
  Name: string;
  CategoryID?: string; // Note: API returns CategoryID (uppercase D)
  CategoryName?: string;
  UnitID?: string;
  UnitName?: string;
  Price: number;
  Description?: string;
  Inactive: boolean;
  ItemType?: number;
  IsSeftPrice?: boolean;
  AllowAdjustPrice?: boolean;
  GroupQuantity?: number;
  Quantity?: number;
  ImageType?: number;
}

// Category types (from /api/v1/categories/list)
export interface CukcukInventoryCategory {
  Id: string;
  Code?: string;
  Name: string;
  IsLeaf?: boolean;
  CategoryType?: number;
  Grade?: number;
  Inactive: boolean;
}

export interface CukcukInventoryListResponse {
  Success: boolean;
  ErrorType: number;
  Code?: number;
  Data?: CukcukInventoryItem[];
  Total?: number;
  Message?: string;
  ErrorMessage?: string;
}

export interface CukcukCategoryListResponse {
  Success: boolean;
  ErrorType: number;
  Code?: number;
  Data?: CukcukInventoryCategory[];
  Message?: string;
  ErrorMessage?: string;
}

// Branch types (from /api/v1/branchs/all)
export interface CukcukBranch {
  Id: string;
  Code: string;
  Name: string;
  IsBaseDepot?: boolean;
  Inactive: boolean;
}

export interface CukcukBranchListResponse {
  Success: boolean;
  ErrorType: number;
  Code?: number;
  Data?: CukcukBranch[];
  Total?: number;
  Message?: string;
}

// Order Online types (for /api/v1/order-onlines/create)
export interface CukcukOrderOnlineItem {
  Id: string; // InventoryItemId (GUID)
  Code?: string; // Item code
  ItemType?: number; // Item type from inventory
  Name: string; // Item name
  Price: number; // Unit price
  UnitID?: string; // Unit ID (uppercase)
  UnitName?: string;
  Note?: string; // Special notes for this item
  Quantity: number;
  Additions?: CukcukOrderOnlineAddition[];
}

export interface CukcukOrderOnlineAddition {
  Id: string;
  Description?: string;
  Price: number;
  Quantity: number;
}

export interface CukcukOrderOnlineRequest {
  BranchId: string;
  OrderType: number; // 0 = delivery, 1 = pickup
  OrderCode?: string;
  CustomerName: string;
  CustomerTel: string;
  CustomerEmail?: string;
  ShippingAddress?: string;
  ShippingDueDate?: string;
  ShippingTimeType?: number;
  OrderNote?: string;
  PaymentStatus: number; // 1 = unpaid, 2 = paid
  OrderSource: number; // 1 = restaurant website, 2 = custom app
  Amount?: number;
  TotalAmount?: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  DeliveryAmount?: number;
  DepositAmount?: number;
  OrderItems: CukcukOrderOnlineItem[];
}

export interface CukcukOrderOnlineResponse {
  Success: boolean;
  ErrorType: number;
  Code?: number;
  Data?: string; // OrderCode
  Total?: number;
  Message?: string;
}
