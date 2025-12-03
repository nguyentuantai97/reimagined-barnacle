// Product types
export interface ProductOption {
  id: string;
  name: string;
  choices: ProductOptionChoice[];
}

export interface ProductOptionChoice {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface Product {
  id: string;
  cukcukId: string;
  cukcukCode?: string;
  cukcukItemType?: number;
  cukcukUnitId?: string;
  cukcukUnitName?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  options?: ProductOption[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

// Cart types
export interface CartItemOption {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: CartItemOption[];
  note?: string;
  totalPrice: number;
}

// Order types
export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}

export interface OrderItem {
  productId: string;
  cukcukId: string;
  cukcukCode?: string;
  cukcukItemType?: number;
  cukcukUnitId?: string;
  cukcukUnitName?: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
  options: CartItemOption[];
  note?: string;
}

export interface Order {
  id: string;
  cukcukOrderId?: string;
  orderNo: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CukcukLoginResponse {
  accessToken: string;
  companyCode: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  orderId: string;
}
