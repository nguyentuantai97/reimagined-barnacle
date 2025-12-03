# Trà Sữa AN - Online Ordering Website

Trang web đặt món trực tuyến cho tiệm trà sữa AN, tích hợp với phần mềm quản lý CUKCUK.

## Tính năng

- **Giao diện đẹp mắt** - Thiết kế hiện đại, responsive, tương tự Phúc Long, Phê La
- **Đặt hàng online** - Khách hàng dễ dàng chọn món, tuỳ chỉnh options, thêm vào giỏ hàng
- **Tích hợp CUKCUK** - Đơn hàng tự động đồng bộ với hệ thống POS CUKCUK
- **In bill/tem tự động** - Khi khách đặt hàng, bill và tem dán ly tự động in ra

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Form Validation**: React Hook Form + Zod
- **Backend**: Next.js API Routes
- **Integration**: CUKCUK GraphQL API

## Cài đặt

### 1. Clone project

```bash
cd "d:\TS AN\tea-shop-an"
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment

Copy file `.env.example` thành `.env.local` và điền thông tin:

```env
# CUKCUK Integration
CUKCUK_DOMAIN=your-domain.cukcuk.vn
CUKCUK_SECRET_KEY=your-secret-key

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SHOP_NAME=Trà Sữa AN
NEXT_PUBLIC_SHOP_PHONE=0909123456
```

### 4. Lấy CUKCUK credentials

1. Đăng nhập CUKCUK dashboard (https://your-domain.cukcuk.vn)
2. Vào **Applications > API**
3. Click **CREATE CONNECTION CODE**
4. Click **ALLOW CONNECTION** để kích hoạt API gateway
5. Copy **Domain** và **SecretKey** vào file `.env.local`

### 5. Chạy development server

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

## Quy trình đặt hàng

```
1. Khách truy cập web (link trực tiếp / QR code / search)
   ↓
2. Chọn món từ menu, tuỳ chỉnh (size, đường, đá, topping)
   ↓
3. Thêm vào giỏ hàng
   ↓
4. Vào trang checkout, nhập thông tin:
   - Họ tên
   - Số điện thoại
   - Địa chỉ giao hàng
   - Vị trí GPS (tuỳ chọn)
   - Ghi chú
   ↓
5. Xác nhận đặt hàng
   ↓
6. Backend xử lý:
   - Gửi order đến CUKCUK API
   - CUKCUK tự động in bill + tem dán ly
   - Lưu backup vào database local
   ↓
7. Hiển thị trang Order Success với mã đơn hàng
```

## Cấu trúc thư mục

```
tea-shop-an/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Trang chủ
│   │   ├── menu/               # Trang menu
│   │   ├── checkout/           # Trang thanh toán
│   │   ├── order-success/      # Trang đặt hàng thành công
│   │   └── api/orders/         # API tạo đơn hàng
│   ├── components/             # React components
│   │   ├── layout/             # Header, Footer
│   │   ├── menu/               # Product card, grid, modal
│   │   └── cart/               # Cart drawer, items
│   ├── lib/
│   │   ├── cukcuk/             # CUKCUK API integration
│   │   ├── data/menu.ts        # Sample menu data
│   │   └── format.ts           # Utility functions
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── .env.example                # Environment template
└── README.md
```

## Tuỳ chỉnh

### Thêm/sửa menu

Chỉnh sửa file `src/lib/data/menu.ts`:

```typescript
export const products: Product[] = [
  {
    id: 'ts-001',
    cukcukId: 'CUKCUK_TS001',  // ID sản phẩm trong CUKCUK
    name: 'Trà Sữa Truyền Thống',
    description: 'Mô tả sản phẩm...',
    price: 35000,
    image: '/images/products/tra-sua.jpg',
    category: 'tra-sua',
    isAvailable: true,
    options: [sizeOptions, sugarOptions, iceOptions, toppingOptions],
  },
  // ...
];
```

### Thay đổi giao diện

- **Màu sắc**: Chỉnh sửa Tailwind classes (amber-*, gray-*, etc.)
- **Font**: Thay đổi font trong `src/app/layout.tsx`
- **Logo**: Thay file trong `public/` và update components

## In Bill/Tem

CUKCUK tự động xử lý việc in khi nhận order qua API:

1. Cấu hình máy in trong CUKCUK dashboard
2. Chọn template cho bill và tem
3. Khi order được tạo, CUKCUK sẽ tự động gửi lệnh in

### Nội dung Bill

```
═══════════════════════════════
        TRÀ SỮA AN
    Địa chỉ: [Địa chỉ tiệm]
    ĐT: [Số điện thoại tiệm]
═══════════════════════════════

Mã đơn: AN-1701234567890
Ngày: 03/12/2025 14:30

Khách hàng: Nguyễn Văn A
SĐT: 0909123456
Địa chỉ: 123 Đường ABC, Q.1

───────────────────────────────
Trà sữa truyền thống x2  90.000đ
  - Size L, 70% đường, Ít đá

Trà đào cam sả x1        55.000đ
───────────────────────────────

Tạm tính:              145.000đ
Phí giao hàng:          15.000đ
───────────────────────────────
TỔNG CỘNG:             160.000đ

Cảm ơn quý khách!
═══════════════════════════════
```

## Deploy

### Vercel (Recommended)

1. Push code lên GitHub
2. Import project vào Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t tea-shop-an .
docker run -p 3000:3000 tea-shop-an
```

## Support

Liên hệ hỗ trợ kỹ thuật khi cần thiết.

## License

MIT License
