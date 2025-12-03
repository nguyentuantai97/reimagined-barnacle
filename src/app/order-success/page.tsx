'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || 'N/A';

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
          </div>

          {/* Info */}
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

          {/* Contact */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Cần hỗ trợ? Gọi ngay:</p>
            <a
              href="tel:0909123456"
              className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800"
            >
              <Phone className="h-4 w-4" />
              0909 123 456
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
