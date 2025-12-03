import { Product, Category } from '@/types';

// Categories
export const categories: Category[] = [
  { id: 'tra-sua', name: 'Trà Sữa', slug: 'tra-sua' },
  { id: 'tra-trai-cay', name: 'Trà Trái Cây', slug: 'tra-trai-cay' },
  { id: 'ca-phe', name: 'Cà Phê', slug: 'ca-phe' },
  { id: 'nuoc-ep', name: 'Nước Ép', slug: 'nuoc-ep' },
  { id: 'topping', name: 'Topping', slug: 'topping' },
];

// Sugar level options
export const sugarOptions = {
  id: 'sugar',
  name: 'Độ ngọt',
  choices: [
    { id: 'sugar-0', name: '0% đường', priceAdjustment: 0 },
    { id: 'sugar-30', name: '30% đường', priceAdjustment: 0 },
    { id: 'sugar-50', name: '50% đường', priceAdjustment: 0 },
    { id: 'sugar-70', name: '70% đường', priceAdjustment: 0 },
    { id: 'sugar-100', name: '100% đường', priceAdjustment: 0 },
  ],
};

// Ice level options
export const iceOptions = {
  id: 'ice',
  name: 'Độ đá',
  choices: [
    { id: 'ice-0', name: 'Không đá', priceAdjustment: 0 },
    { id: 'ice-30', name: 'Ít đá', priceAdjustment: 0 },
    { id: 'ice-50', name: 'Đá vừa', priceAdjustment: 0 },
    { id: 'ice-100', name: 'Đá bình thường', priceAdjustment: 0 },
  ],
};

// Topping options
export const toppingOptions = {
  id: 'topping',
  name: 'Topping',
  choices: [
    { id: 'topping-none', name: 'Không thêm', priceAdjustment: 0 },
    { id: 'topping-tran-chau', name: 'Trân châu đen', priceAdjustment: 8000 },
    { id: 'topping-tran-chau-trang', name: 'Trân châu trắng', priceAdjustment: 8000 },
    { id: 'topping-thach-dua', name: 'Thạch dừa', priceAdjustment: 8000 },
    { id: 'topping-pudding', name: 'Pudding', priceAdjustment: 10000 },
    { id: 'topping-kem-cheese', name: 'Kem cheese', priceAdjustment: 12000 },
  ],
};

// Size options
export const sizeOptions = {
  id: 'size',
  name: 'Size',
  choices: [
    { id: 'size-m', name: 'Size M', priceAdjustment: 0 },
    { id: 'size-l', name: 'Size L', priceAdjustment: 6000 },
  ],
};

// Sample products (sẽ được thay thế bằng data từ CUKCUK)
export const products: Product[] = [
  // Trà Sữa
  {
    id: 'ts-001',
    cukcukId: 'CUKCUK_TS001',
    name: 'Trà Sữa Truyền Thống',
    description: 'Trà sữa đậm đà hương vị truyền thống với trà đen Ceylon thượng hạng',
    price: 35000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  {
    id: 'ts-002',
    cukcukId: 'CUKCUK_TS002',
    name: 'Trà Sữa Matcha',
    description: 'Trà xanh matcha Nhật Bản kết hợp sữa tươi béo ngậy',
    price: 42000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  {
    id: 'ts-003',
    cukcukId: 'CUKCUK_TS003',
    name: 'Trà Sữa Socola',
    description: 'Socola Bỉ thượng hạng hòa quyện cùng sữa tươi',
    price: 42000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  {
    id: 'ts-004',
    cukcukId: 'CUKCUK_TS004',
    name: 'Trà Sữa Khoai Môn',
    description: 'Khoai môn tím tự nhiên, béo ngọt tự nhiên',
    price: 40000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  {
    id: 'ts-005',
    cukcukId: 'CUKCUK_TS005',
    name: 'Trà Sữa Ô Long',
    description: 'Trà ô long Đài Loan thơm ngọt, hương vị thanh tao',
    price: 38000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  {
    id: 'ts-006',
    cukcukId: 'CUKCUK_TS006',
    name: 'Trà Sữa Đường Đen',
    description: 'Đường đen Okinawa kết hợp sữa tươi, vị ngọt thanh đặc trưng',
    price: 45000,
    image: '',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },

  // Trà Trái Cây
  {
    id: 'ttc-001',
    cukcukId: 'CUKCUK_TTC001',
    name: 'Trà Đào Cam Sả',
    description: 'Trà ô long, đào miếng, cam tươi và sả thơm mát',
    price: 45000,
    image: '',
    category: 'tra-trai-cay',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions],
  },
  {
    id: 'ttc-002',
    cukcukId: 'CUKCUK_TTC002',
    name: 'Trà Vải Lài',
    description: 'Trà lài hoa tươi kết hợp vải thiều ngọt mát',
    price: 42000,
    image: '',
    category: 'tra-trai-cay',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions],
  },
  {
    id: 'ttc-003',
    cukcukId: 'CUKCUK_TTC003',
    name: 'Trà Chanh Dây',
    description: 'Chanh dây tươi chua ngọt, giải khát tuyệt vời',
    price: 38000,
    image: '',
    category: 'tra-trai-cay',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions],
  },
  {
    id: 'ttc-004',
    cukcukId: 'CUKCUK_TTC004',
    name: 'Trà Xoài',
    description: 'Xoài chín mọng kết hợp trà xanh thanh mát',
    price: 40000,
    image: '',
    category: 'tra-trai-cay',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions],
  },

  // Cà Phê
  {
    id: 'cf-001',
    cukcukId: 'CUKCUK_CF001',
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê phin truyền thống Việt Nam với sữa đặc',
    price: 29000,
    image: '',
    category: 'ca-phe',
    isAvailable: true,
    options: [sizeOptions, iceOptions],
  },
  {
    id: 'cf-002',
    cukcukId: 'CUKCUK_CF002',
    name: 'Bạc Xỉu',
    description: 'Cà phê nhẹ với nhiều sữa, vị ngọt dịu',
    price: 32000,
    image: '',
    category: 'ca-phe',
    isAvailable: true,
    options: [sizeOptions, iceOptions],
  },
  {
    id: 'cf-003',
    cukcukId: 'CUKCUK_CF003',
    name: 'Cà Phê Đen Đá',
    description: 'Cà phê phin đậm đà, nguyên chất',
    price: 25000,
    image: '',
    category: 'ca-phe',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions],
  },

  // Nước Ép
  {
    id: 'ne-001',
    cukcukId: 'CUKCUK_NE001',
    name: 'Nước Ép Cam',
    description: 'Cam tươi nguyên chất, giàu vitamin C',
    price: 35000,
    image: '',
    category: 'nuoc-ep',
    isAvailable: true,
    options: [sizeOptions, sugarOptions],
  },
  {
    id: 'ne-002',
    cukcukId: 'CUKCUK_NE002',
    name: 'Nước Ép Dưa Hấu',
    description: 'Dưa hấu tươi mát, thanh nhiệt',
    price: 32000,
    image: '',
    category: 'nuoc-ep',
    isAvailable: true,
    options: [sizeOptions, sugarOptions],
  },
  {
    id: 'ne-003',
    cukcukId: 'CUKCUK_NE003',
    name: 'Sinh Tố Bơ',
    description: 'Bơ sáp béo ngậy, thơm ngon',
    price: 40000,
    image: '',
    category: 'nuoc-ep',
    isAvailable: true,
    options: [sizeOptions, sugarOptions],
  },
];

// Helper to get products by category
export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter((p) => p.category === categorySlug);
};

// Helper to get product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};
