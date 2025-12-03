'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { formatPriceShort, isValidVietnamesePhone } from '@/lib/format';

// Tọa độ quán AN Milk Tea - 112 Hoàng Phan Thái, Bình Chánh
const SHOP_LOCATION = {
  latitude: 10.6847,
  longitude: 106.6095,
};

// Giá ship: 5.000đ/km
const DELIVERY_PRICE_PER_KM = 5000;

/**
 * Tính khoảng cách đường đi thực tế bằng OSRM API (miễn phí)
 * Sử dụng OpenStreetMap routing - chính xác như Google Maps
 */
async function calculateRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  try {
    // OSRM API: lon,lat format (ngược với Google Maps)
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Khoảng cách trả về là mét, chuyển sang km
      const distanceInKm = data.routes[0].distance / 1000;
      return distanceInKm;
    }

    // Fallback: nếu OSRM fail, dùng Haversine x 2.5
    return calculateHaversineDistance(lat1, lon1, lat2, lon2) * 2.5;
  } catch {
    // Fallback: nếu lỗi mạng, dùng Haversine x 2.5
    return calculateHaversineDistance(lat1, lon1, lat2, lon2) * 2.5;
  }
}

/**
 * Tính khoảng cách đường chim bay (backup)
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tính số km được giảm dựa theo giá trị đơn hàng
 * - 100k-199k: giảm 1km
 * - 200k-299k: giảm 2km
 * - 300k-399k: giảm 3km
 * - ...
 */
function getDiscountKm(subtotal: number): number {
  if (subtotal < 100000) return 0;
  return Math.floor(subtotal / 100000);
}

/**
 * Tính phí giao hàng
 * @param distance Khoảng cách (km)
 * @param subtotal Giá trị đơn hàng (chưa tính ship)
 */
function calculateDeliveryFee(distance: number | null, subtotal: number): number {
  if (distance === null) return 0; // Chưa có vị trí

  const discountKm = getDiscountKm(subtotal);
  const chargeableKm = Math.max(0, Math.ceil(distance) - discountKm);

  return chargeableKm * DELIVERY_PRICE_PER_KM;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const subtotal = getSubtotal();
  const deliveryFee = calculateDeliveryFee(distance, subtotal);
  const discountKm = getDiscountKm(subtotal);
  const total = subtotal + deliveryFee;

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🛒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h1>
          <p className="text-gray-500 mb-4">Vui lòng thêm sản phẩm vào giỏ hàng</p>
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/menu">Xem Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        // Tính khoảng cách đường đi thực tế bằng OSRM API
        const dist = await calculateRoadDistance(
          SHOP_LOCATION.latitude,
          SHOP_LOCATION.longitude,
          latitude,
          longitude
        );
        setDistance(dist);
        setIsGettingLocation(false);
      },
      () => {
        alert('Không thể lấy vị trí. Vui lòng nhập địa chỉ thủ công.');
        setIsGettingLocation(false);
      }
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!isValidVietnamesePhone(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng';
    }

    if (distance === null) {
      newErrors.address = 'Vui lòng bấm nút định vị để tính phí giao hàng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          note: formData.note,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          cukcukId: item.product.cukcukId,
          cukcukCode: item.product.cukcukCode,
          cukcukItemType: item.product.cukcukItemType,
          cukcukUnitId: item.product.cukcukUnitId,
          cukcukUnitName: item.product.cukcukUnitName,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          amount: item.totalPrice,
          options: item.selectedOptions,
          note: item.note,
        })),
        subtotal,
        deliveryFee,
        total,
      };

      // Call API to create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart and redirect to success page
        clearCart();
        router.push(`/order-success?orderNo=${result.data.orderNo}`);
      } else {
        alert(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/menu"
          className="inline-flex items-center text-amber-700 hover:text-amber-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tiếp tục mua sắm
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Thanh toán
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Họ tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nhập họ tên người nhận"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại (VD: 0909123456)"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Địa chỉ giao hàng <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ giao hàng"
                        className={`flex-1 ${errors.address ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getLocation}
                        disabled={isGettingLocation}
                        className="shrink-0"
                      >
                        {isGettingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.address && (
                      <p className="text-sm text-red-500">{errors.address}</p>
                    )}
                    {distance !== null && (
                      <p className="text-sm text-green-600">
                        ✓ Đã lấy vị trí - Khoảng cách: {distance.toFixed(1)} km
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú (tuỳ chọn)</Label>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Ghi chú cho đơn hàng (VD: Giao trước 12h, gọi trước khi giao...)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Submit Button - Desktop */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base hidden lg:flex"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      `Xác nhận đặt hàng - ${formatPriceShort(total)}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Đơn hàng ({items.length} sản phẩm)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-gray-500">x{item.quantity}</p>
                      </div>
                      <span className="shrink-0">{formatPriceShort(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tạm tính</span>
                    <span>{formatPriceShort(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phí giao hàng</span>
                    {distance !== null ? (
                      <span>{formatPriceShort(deliveryFee)}</span>
                    ) : (
                      <span className="text-amber-600 text-xs">Bấm định vị để tính</span>
                    )}
                  </div>
                  {distance !== null && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Khoảng cách: {distance.toFixed(1)} km</p>
                      <p>• Giá ship: 5.000đ/km</p>
                      {discountKm > 0 && (
                        <p className="text-green-600">• Giảm {discountKm} km (đơn từ {formatPriceShort(discountKm * 100000)})</p>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-amber-700">{formatPriceShort(total)}</span>
                  </div>
                </div>

                {/* Payment Method Note */}
                <div className="bg-amber-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-amber-800 mb-1">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-amber-600">
                    Quý khách vui lòng thanh toán khi nhận hàng
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button - Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  `Xác nhận đặt hàng - ${formatPriceShort(total)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
