/**
 * Test script to verify CUKCUK order creation
 * Run: node test-cukcuk-order.js
 */

const ORDER_API = 'https://anmilktea.online/api/orders';

async function testOrder() {
  console.log('🧪 Testing CUKCUK Order Creation...\n');

  const testOrderData = {
    orderType: 'delivery',
    customer: {
      name: 'Nguyễn Test CUKCUK',
      phone: '0976257223',
      address: '112 Đường Hoàng Phan Thái, Bình Chánh',
      note: '[TEST] Đơn test CUKCUK integration',
      latitude: 10.666694951717572,
      longitude: 106.56490596564488,
    },
    items: [
      {
        id: 'TS',
        cukcukId: 'e9c13499-ca91-468e-bc42-992f1a72e32d',
        cukcukCode: 'TS',
        cukcukItemType: 6,
        cukcukUnitId: '712e08f9-7008-4eac-b655-7572f70ded79',
        cukcukUnitName: 'Ly',
        name: 'Trà Sữa',
        price: 17000,
        quantity: 1,
        options: [
          {
            optionId: 'sugar',
            optionName: 'Ngọt',
            choiceId: 'sugar-70',
            choiceName: '70%',
            priceAdjustment: 0,
          },
          {
            optionId: 'ice',
            optionName: 'Đá',
            choiceId: 'ice-100',
            choiceName: '100%',
            priceAdjustment: 0,
          },
        ],
        note: '',
      },
    ],
    subtotal: 17000,
    deliveryFee: 15000,
    total: 32000,
  };

  try {
    console.log('📤 Sending order to:', ORDER_API);
    console.log('📦 Order data:', JSON.stringify(testOrderData, null, 2));
    console.log('\n⏳ Waiting for response...\n');

    const response = await fetch(ORDER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData),
    });

    const result = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Order Created Successfully!');
      console.log('📝 Order Number:', result.data.orderNo);
      console.log('🔄 CUKCUK Synced:', result.data.cukcukSynced);

      if (result.data.cukcukSynced) {
        console.log('\n🎉 SUCCESS: CUKCUK đã nhận đơn!');
        console.log('👉 Vào CUKCUK PC/Web → Đơn hàng online → Tìm mã:', result.data.orderNo);
        console.log('👉 Nhân viên bấm "Xác nhận" để in bill và tem');
      } else {
        console.log('\n⚠️ WARNING: Đơn tạo thành công nhưng CUKCUK CHƯA NHẬN');
        console.log('❌ CUKCUK Error:', result.data.cukcukError);
        console.log('\n🔍 Các lỗi có thể xảy ra:');
        console.log('  1. CUKCUK_DOMAIN hoặc CUKCUK_SECRET_KEY sai');
        console.log('  2. Branch ID không đúng');
        console.log('  3. CUKCUK API endpoint thay đổi');
        console.log('  4. Token expired hoặc authentication failed');
      }
    } else {
      console.log('\n❌ Order Creation Failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Test Failed:', error.message);
    console.error(error);
  }
}

// Run test
testOrder();
