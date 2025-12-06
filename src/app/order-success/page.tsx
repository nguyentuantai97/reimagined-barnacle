'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Phone, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SHOP_ADDRESS = 'Đường Hoàng Phan Thái, Bình Chánh, TP.HCM';
const SHOP_GOOGLE_MAPS = 'https://maps.google.com/?q=10.6667,106.5649';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || 'N/A';
  const orderType = searchParams.get('type') || 'delivery';
  const timeParam = searchParams.get('time');
  const isPickup = orderType === 'pickup';

  // Format thời gian đặt hàng
  const formatOrderTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return {
        time: `${hours}:${minutes}`,
        date: `${day}/${month}/${year}`,
      };
    } catch {
      return null;
    }
  };

  const orderTime = formatOrderTime(timeParam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã đặt hàng tại Trà Sữa AN
          </p>

          {/* Order Number */}
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-600 mb-1">Mã đơn hàng của bạn</p>
            <p className="text-2xl font-bold text-amber-800">{orderNo}</p>
            {orderTime && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
                  <Clock className="h-4 w-4" />
                  <span>Đặt lúc: <strong>{orderTime.time}</strong> ngày {orderTime.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Info - Different for delivery vs pickup */}
          {isPickup ? (
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">1.</span>
                <p className="text-gray-600">
                  Đơn hàng của bạn đang được pha chế và sẽ sẵn sàng trong <strong>10-15 phút</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">2.</span>
                <p className="text-gray-600">
                  Vui lòng đến lấy đơn hàng tại: <strong>{SHOP_ADDRESS}</strong>
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">3.</span>
                <p className="text-gray-600">
                  Thanh toán khi nhận hàng. Đến trong vòng <strong>30 phút</strong> sau khi đặt hàng.
                </p>
              </div>
              {/* Google Maps link */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={SHOP_GOOGLE_MAPS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-700 font-medium hover:text-amber-800 text-sm"
                >
                  <ArrowRight className="h-4 w-4" />
                  Xem chỉ đường trên Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">1.</span>
                <p className="text-gray-600">
                  Đơn hàng của bạn đang được xử lý và sẽ sớm được giao đến.
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">2.</span>
                <p className="text-gray-600">
                  Thời gian giao hàng dự kiến: <strong>15-30 phút</strong>
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-amber-600 mt-0.5">3.</span>
                <p className="text-gray-600">
                  Vui lòng thanh toán khi nhận hàng (COD).
                </p>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Cần hỗ trợ? Gọi ngay:</p>
            <a
              href="tel:0976257223"
              className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800"
            >
              <Phone className="h-4 w-4" />
              0976 257 223
            </a>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              asChild
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link href="/menu">
                Đặt thêm món khác
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
