'use client';

import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPriceShort } from '@/lib/format';

interface OrderInfo {
  orderNo: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: string;
}

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError('Vui lòng nhập mã đơn hàng hoặc số điện thoại');
      return;
    }

    setLoading(true);
    setError('');

    // Get orders from localStorage
    try {
      const savedOrders = localStorage.getItem('tea-shop-orders');
      if (!savedOrders) {
        setError('Không tìm thấy đơn hàng');
        setOrders([]);
        setLoading(false);
        return;
      }

      const allOrders: OrderInfo[] = JSON.parse(savedOrders);
      const query = searchQuery.trim().toLowerCase();

      // Search by order code or phone
      const foundOrders = allOrders.filter(
        (order) =>
          order.orderNo.toLowerCase().includes(query) ||
          order.customerPhone.includes(query.replace(/\s/g, ''))
      );

      if (foundOrders.length === 0) {
        setError('Không tìm thấy đơn hàng');
        setOrders([]);
      } else {
        setOrders(foundOrders);
        setError('');
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Có lỗi xảy ra khi tra cứu đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const copyOrderCode = (orderNo: string) => {
    navigator.clipboard.writeText(orderNo).then(() => {
      setCopiedCode(orderNo);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package className="h-8 w-8 text-amber-700" />
            <h1 className="text-3xl font-bold text-amber-900">Tra cứu đơn hàng</h1>
          </div>
          <p className="text-amber-700">
            Nhập mã đơn hàng (AN-xxxx) hoặc số điện thoại để tra cứu
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="VD: AN-0001 hoặc 0976257223"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-6 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Đang tìm...' : 'Tra cứu'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.orderNo}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-6 w-6" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{order.orderNo}</span>
                          <button
                            onClick={() => copyOrderCode(order.orderNo)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Sao chép mã đơn hàng"
                          >
                            {copiedCode === order.orderNo ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm opacity-90">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Đã nhận</span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4">
                  <div className="mb-4 pb-4 border-b">
                    <h3 className="font-semibold text-gray-900 mb-2">Thông tin khách hàng</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tên:</span> {order.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">SĐT:</span>{' '}
                      {order.customerPhone}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Chi tiết đơn hàng</h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start text-sm"
                        >
                          <div className="flex-1">
                            <span className="text-gray-700">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                          <span className="font-medium text-amber-700 ml-2">
                            {formatPriceShort(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-amber-700">
                      {formatPriceShort(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-amber-700">
          <p className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Lưu ý: Chỉ hiển thị đơn hàng được lưu trên thiết bị này
          </p>
          <p className="mt-2">
            Nếu cần hỗ trợ, vui lòng liên hệ:{' '}
            <a href="tel:0976257223" className="font-semibold underline">
              0976 257 223
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
