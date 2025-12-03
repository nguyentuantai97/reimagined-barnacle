'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, Search, Truck, Store, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { formatPriceShort, isValidVietnamesePhone } from '@/lib/format';
import { cn } from '@/lib/utils';

// Giá ship: 5.000đ/km
const DELIVERY_PRICE_PER_KM = 5000;

// Địa chỉ cửa hàng
const SHOP_ADDRESS = 'Đường Hoàng Phan Thái, Bình Chánh, TP.HCM';
const SHOP_GOOGLE_MAPS = 'https://maps.google.com/?q=10.6667,106.5649';

type OrderType = 'delivery' | 'pickup';

/**
 * Tính khoảng cách đường đi thực tế bằng API route
 * Hỗ trợ cả GPS và geocoding từ địa chỉ
 */
async function calculateDistance(params: {
  latitude?: number;
  longitude?: number;
  address?: string;
}): Promise<{ distance: number; coordinates?: { latitude: number; longitude: number } } | { error: string }> {
  try {
    const response = await fetch('/api/distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (data.success) {
      return {
        distance: data.distance,
        coordinates: data.coordinates,
      };
    }

    return { error: data.error || 'Không thể tính khoảng cách' };
  } catch {
    return { error: 'Lỗi kết nối. Vui lòng thử lại.' };
  }
}

/**
 * Tính số km được giảm dựa theo giá trị đơn hàng
 */
function getDiscountKm(subtotal: number): number {
  if (subtotal < 100000) return 0;
  return Math.floor(subtotal / 100000);
}

/**
 * Làm tròn km lên 0.5 để tính tiền
 */
function roundKmForBilling(km: number): number {
  return Math.ceil(km * 2) / 2;
}

/**
 * Tính phí giao hàng
 */
function calculateDeliveryFee(distance: number | null, subtotal: number): number {
  if (distance === null) return 0;

  const discountKm = getDiscountKm(subtotal);
  const roundedKm = roundKmForBilling(distance);
  const chargeableKm = Math.max(0, roundedKm - discountKm);

  return chargeableKm * DELIVERY_PRICE_PER_KM;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCalculatingFromAddress, setIsCalculatingFromAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceSource, setDistanceSource] = useState<'gps' | 'address' | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const subtotal = getSubtotal();
  const deliveryFee = orderType === 'delivery' ? calculateDeliveryFee(distance, subtotal) : 0;
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getLocationFromGPS = () => {
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
        const result = await calculateDistance({ latitude, longitude });
        if ('distance' in result) {
          setDistance(result.distance);
          setDistanceSource('gps');
        } else {
          alert(result.error);
        }
        setIsGettingLocation(false);
      },
      () => {
        alert('Không thể lấy vị trí GPS. Vui lòng dùng nút "Tính phí ship" từ địa chỉ.');
        setIsGettingLocation(false);
      }
    );
  };

  const calculateFromAddress = async () => {
    if (!formData.address.trim()) {
      setErrors((prev) => ({ ...prev, address: 'Vui lòng nhập địa chỉ' }));
      return;
    }

    setIsCalculatingFromAddress(true);
    const result = await calculateDistance({ address: formData.address });

    if ('distance' in result) {
      setDistance(result.distance);
      setDistanceSource('address');
      if (result.coordinates) {
        setFormData((prev) => ({
          ...prev,
          latitude: result.coordinates!.latitude,
          longitude: result.coordinates!.longitude,
        }));
      }
      setErrors((prev) => ({ ...prev, address: '' }));
    } else {
      setErrors((prev) => ({ ...prev, address: result.error }));
    }

    setIsCalculatingFromAddress(false);
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

    if (orderType === 'delivery') {
      if (!formData.address.trim()) {
        newErrors.address = 'Vui lòng nhập địa chỉ giao hàng';
      }

      if (distance === null) {
        newErrors.address = 'Vui lòng bấm nút định vị để tính phí giao hàng';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const orderData = {
        orderType,
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: orderType === 'delivery' ? formData.address : SHOP_ADDRESS,
          latitude: orderType === 'delivery' ? formData.latitude : null,
          longitude: orderType === 'delivery' ? formData.longitude : null,
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

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        router.push(`/order-success?orderNo=${result.data.orderNo}&type=${orderType}`);
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

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Thanh toán
        </h1>

        {/* Order Type Tabs */}
        <div className="bg-white rounded-xl p-1.5 mb-6 inline-flex shadow-sm border border-gray-200">
          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
              orderType === 'delivery'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Truck className="h-5 w-5" />
            <span>Giao hàng</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType('pickup')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
              orderType === 'pickup'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Store className="h-5 w-5" />
            <span>Đến lấy</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {orderType === 'delivery' ? 'Thông tin giao hàng' : 'Thông tin nhận hàng'}
                </CardTitle>
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

                  {/* Address - Only for delivery */}
                  {orderType === 'delivery' ? (
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
                          onClick={getLocationFromGPS}
                          disabled={isGettingLocation}
                          className="shrink-0"
                          title="Lấy vị trí GPS"
                        >
                          {isGettingLocation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={calculateFromAddress}
                          disabled={isCalculatingFromAddress || !formData.address.trim()}
                          className="shrink-0"
                          title="Tính phí ship từ địa chỉ"
                        >
                          {isCalculatingFromAddress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Bấm <MapPin className="h-3 w-3 inline" /> để dùng GPS hoặc <Search className="h-3 w-3 inline" /> để tính từ địa chỉ
                      </p>
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address}</p>
                      )}
                      {distance !== null && (
                        <p className="text-sm text-green-600">
                          ✓ {distanceSource === 'gps' ? 'GPS' : 'Địa chỉ'} - Khoảng cách: {distance.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Pickup Location Info */
                    <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Store className="h-5 w-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">AN Milk Tea & Tea</h4>
                          <p className="text-sm text-gray-600 mt-1">{SHOP_ADDRESS}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>10:00 - 21:00</span>
                        </div>
                        <a
                          href={SHOP_GOOGLE_MAPS}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-medium"
                        >
                          <Navigation className="h-4 w-4" />
                          <span>Chỉ đường</span>
                        </a>
                      </div>
                      <p className="text-sm text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                        Vui lòng đến quán trong vòng 30 phút sau khi đặt hàng để nhận đồ uống
                      </p>
                    </div>
                  )}

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú (tuỳ chọn)</Label>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder={orderType === 'delivery'
                        ? 'Ghi chú cho đơn hàng (VD: Giao trước 12h, gọi trước khi giao...)'
                        : 'Ghi chú cho đơn hàng (VD: Thời gian đến lấy...)'
                      }
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
                    {orderType === 'pickup' ? (
                      <span className="text-green-600 font-medium">Miễn phí</span>
                    ) : distance !== null ? (
                      <span>{formatPriceShort(deliveryFee)}</span>
                    ) : (
                      <span className="text-amber-600 text-xs">Bấm định vị để tính</span>
                    )}
                  </div>
                  {orderType === 'delivery' && distance !== null && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Khoảng cách: {distance.toFixed(1)} km → tính {roundKmForBilling(distance)} km</p>
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
                  <p className="font-medium text-amber-800 mb-1">
                    {orderType === 'delivery' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán tại quán'}
                  </p>
                  <p className="text-amber-600">
                    {orderType === 'delivery'
                      ? 'Quý khách vui lòng thanh toán khi nhận hàng'
                      : 'Quý khách thanh toán khi đến lấy đồ uống'
                    }
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
