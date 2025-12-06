'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, Search, Truck, Store, Clock, Navigation, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/ui/logo';
import { useCartStore } from '@/stores/cart-store';
import { formatPriceShort, isValidVietnamesePhone } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isShopOpen, BUSINESS_HOURS, SHOP_CONTACT } from '@/lib/business-hours';

// Giá ship: 5.000đ/km
const DELIVERY_PRICE_PER_KM = 5000;

// Địa chỉ cửa hàng
const SHOP_ADDRESS = 'Đường Hoàng Phan Thái, Bình Chánh, TP.HCM';
const SHOP_GOOGLE_MAPS = 'https://maps.google.com/?q=10.666694951717572,106.56490596564488';

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
  const [shopOpen, setShopOpen] = useState(true);

  // Check shop hours on mount and every minute
  useEffect(() => {
    setShopOpen(isShopOpen());
    const interval = setInterval(() => {
      setShopOpen(isShopOpen());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Honeypot field for bot detection (hidden from users)
  const [honeypot, setHoneypot] = useState('');

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

    // Options cần thiết cho Safari và các trình duyệt khác
    const geoOptions: PositionOptions = {
      enableHighAccuracy: true, // Yêu cầu độ chính xác cao
      timeout: 15000, // Timeout 15 giây (Safari cần timeout rõ ràng)
      maximumAge: 0, // Không dùng cache, lấy vị trí mới
    };

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
      (error) => {
        setIsGettingLocation(false);
        // Xử lý các loại lỗi cụ thể
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Bạn đã từ chối quyền truy cập vị trí.\n\nĐể bật lại:\n• Safari: Cài đặt → Quyền riêng tư → Dịch vụ định vị → Safari\n• Chrome: Cài đặt → Quyền riêng tư → Vị trí');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Không thể xác định vị trí. Vui lòng:\n• Bật GPS/Định vị trên thiết bị\n• Thử lại hoặc dùng nút "Tính phí ship" từ địa chỉ');
            break;
          case error.TIMEOUT:
            alert('Hết thời gian chờ định vị. Vui lòng:\n• Kiểm tra kết nối mạng\n• Ra ngoài trời để có GPS tốt hơn\n• Hoặc dùng nút "Tính phí ship" từ địa chỉ');
            break;
          default:
            alert('Không thể lấy vị trí GPS. Vui lòng dùng nút "Tính phí ship" từ địa chỉ.');
        }
      },
      geoOptions
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
      // Chỉ cần 1 trong 2: GPS hoặc địa chỉ
      const hasGPS = formData.latitude !== null && formData.longitude !== null;
      const hasAddress = formData.address.trim().length > 0;

      if (!hasGPS && !hasAddress) {
        newErrors.address = 'Vui lòng nhập địa chỉ hoặc bấm nút GPS để định vị';
      }

      // Bắt buộc phải tính phí ship (cần distance)
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
          // Nếu giao hàng: ưu tiên địa chỉ text, nếu không có thì dùng GPS
          address: orderType === 'delivery'
            ? (formData.address.trim() || `GPS: ${formData.latitude}, ${formData.longitude}`)
            : SHOP_ADDRESS,
          latitude: orderType === 'delivery' ? formData.latitude : null,
          longitude: orderType === 'delivery' ? formData.longitude : null,
          note: formData.note,
        },
        // Honeypot for bot detection
        _hp: honeypot,
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

        {/* Shop Closed Notice - Professional & Responsive */}
        {!shopOpen && (
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border border-amber-200/60 rounded-2xl mb-6 shadow-lg">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-orange-200/30 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative p-5 md:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-amber-500/10 rounded-full border-2 border-amber-400/50">
                  <Clock className="h-6 w-6 md:h-7 md:w-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">
                    Ngoài giờ hoạt động
                  </h3>
                  <p className="text-sm text-amber-700 font-medium">
                    {BUSINESS_HOURS.open}:00 – {BUSINESS_HOURS.close}:00 hàng ngày
                  </p>
                </div>
              </div>

              {/* Message */}
              <p className="text-gray-600 text-sm md:text-base mb-5 leading-relaxed">
                Rất tiếc, hệ thống tạm ngừng nhận đơn online. Nếu cần hỗ trợ gấp, quý khách vui lòng liên hệ:
              </p>

              {/* Contact Buttons - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`tel:${SHOP_CONTACT.phone}`}
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3.5 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-base">{SHOP_CONTACT.phoneDisplay}</span>
                </a>
                <a
                  href={SHOP_CONTACT.fanpage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3.5 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className="text-base">Nhắn tin Fanpage</span>
                </a>
              </div>

              {/* Footer message */}
              <p className="text-center text-amber-700/80 text-xs md:text-sm mt-5 font-medium">
                Xin cảm ơn và hẹn gặp lại quý khách!
              </p>
            </div>
          </div>
        )}

        {/* Hide form when shop is closed */}
        {shopOpen && (
        <>
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
                  {/* Honeypot field - hidden from users, visible to bots */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

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
                        Địa chỉ giao hàng
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Nhập địa chỉ hoặc dùng GPS bên dưới"
                          className={`flex-1 ${errors.address ? 'border-red-500' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocationFromGPS}
                          disabled={isGettingLocation}
                          className="shrink-0"
                          title="Lấy vị trí GPS và tính phí ship"
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
                        <MapPin className="h-3 w-3 inline" /> Dùng GPS (nhanh) hoặc nhập địa chỉ rồi bấm <Search className="h-3 w-3 inline" /> để tính phí ship
                      </p>
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address}</p>
                      )}
                      {distance !== null && (
                        <p className="text-sm text-green-600">
                          ✓ {distanceSource === 'gps' ? 'Định vị GPS' : 'Tính từ địa chỉ'} - Khoảng cách: {distance.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Pickup Location Info */
                    <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Logo size="sm" variant="full" className="shrink-0" />
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
                    disabled={isSubmitting || !shopOpen}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base hidden lg:flex disabled:bg-gray-400"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : !shopOpen ? (
                      'Ngoài giờ hoạt động'
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
                disabled={isSubmitting || !shopOpen}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base disabled:bg-gray-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : !shopOpen ? (
                  'Ngoài giờ hoạt động'
                ) : (
                  `Xác nhận đặt hàng - ${formatPriceShort(total)}`
                )}
              </Button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
