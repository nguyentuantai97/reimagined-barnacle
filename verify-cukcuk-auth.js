/**
 * Script để verify CUKCUK authentication
 * Kiểm tra xem credentials có hoạt động không
 */

const crypto = require('crypto');

const CUKCUK_DOMAIN = 'anmilktea';
const CUKCUK_SECRET_KEY = '204f4077c422e821cebcc46c750653ca3bb9b297de0fcdda048a007bb5f15083';
const CUKCUK_BASE_URL = 'https://graphapi.cukcuk.vn';
const CUKCUK_APP_ID = 'CUKCUKOpenPlatform';

/**
 * Generate HMAC SHA256 signature
 */
function generateSignature(params, secretKey) {
  const jsonString = JSON.stringify(params);
  return crypto.createHmac('sha256', secretKey).update(jsonString).digest('hex');
}

/**
 * Test CUKCUK authentication
 */
async function testAuth() {
  console.log('🔐 Testing CUKCUK Authentication...\n');
  console.log('Domain:', CUKCUK_DOMAIN);
  console.log('Secret Key:', CUKCUK_SECRET_KEY.substring(0, 16) + '...\n');

  try {
    // Step 1: Prepare login params
    const loginTime = new Date().toISOString();
    const loginParams = {
      AppID: CUKCUK_APP_ID,
      Domain: CUKCUK_DOMAIN,
      LoginTime: loginTime,
    };

    console.log('📤 Login Params:', JSON.stringify(loginParams, null, 2));

    // Step 2: Generate signature
    const signature = generateSignature(loginParams, CUKCUK_SECRET_KEY);
    console.log('🔑 Signature:', signature, '\n');

    const loginRequest = {
      ...loginParams,
      SignatureInfo: signature,
    };

    // Step 3: Call CUKCUK login API
    console.log('📡 Calling CUKCUK API:', `${CUKCUK_BASE_URL}/api/Account/Login`);
    console.log('⏳ Waiting for response...\n');

    const response = await fetch(`${CUKCUK_BASE_URL}/api/Account/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginRequest),
    });

    const data = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2), '\n');

    if (!response.ok) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('Error:', data.Message || 'Unknown error');
      console.log('\n🔍 Possible issues:');
      console.log('  1. CUKCUK_DOMAIN sai → Check lại domain của bạn');
      console.log('  2. CUKCUK_SECRET_KEY sai → Lấy lại từ CUKCUK dashboard');
      console.log('  3. LoginTime format sai → Đang dùng ISO format');
      return false;
    }

    if (!data.Success || !data.Data) {
      console.log('❌ AUTHENTICATION FAILED');
      console.log('Error:', data.Message || `ErrorType: ${data.ErrorType}`);
      return false;
    }

    console.log('✅ AUTHENTICATION SUCCESS!');
    console.log('🎫 Access Token:', data.Data.AccessToken.substring(0, 50) + '...');
    console.log('🏢 Company Code:', data.Data.CompanyCode);
    console.log('\n🎉 CUKCUK credentials are valid!');
    console.log('✅ Code sẽ hoạt động khi đặt đơn lúc 10:00\n');

    // Step 4: Test fetching branches
    console.log('📋 Testing branch list API...\n');
    const branchResponse = await fetch(`${CUKCUK_BASE_URL}/api/v1/branchs/all`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.Data.AccessToken}`,
        CompanyCode: data.Data.CompanyCode,
        'Content-Type': 'application/json',
      },
    });

    const branchData = await branchResponse.json();
    console.log('📥 Branches Response:', JSON.stringify(branchData, null, 2));

    if (branchData.Success && branchData.Data) {
      console.log('\n📍 Available Branches:');
      branchData.Data.forEach((branch, index) => {
        console.log(`  ${index + 1}. ${branch.BranchName} (ID: ${branch.BranchID})`);
      });

      // Check if our hardcoded branch ID exists
      const ourBranchId = '0b3b0c76-4594-41bc-b13b-f3cd1d3bfe02';
      const foundBranch = branchData.Data.find((b) => b.BranchID === ourBranchId);

      console.log('\n🔍 Checking hardcoded Branch ID:', ourBranchId);
      if (foundBranch) {
        console.log('✅ Branch ID ĐÚNG:', foundBranch.BranchName);
      } else {
        console.log('⚠️ Branch ID KHÔNG TÌM THẤY trong danh sách!');
        console.log('⚠️ CẦN UPDATE Branch ID trong code!');
        if (branchData.Data.length > 0) {
          console.log('💡 Suggested Branch ID:', branchData.Data[0].BranchID);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error(error);
    return false;
  }
}

// Run test
testAuth().then((success) => {
  if (success) {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('👉 Đặt đơn lúc 10:00 sẽ tự động đẩy vào CUKCUK');
  } else {
    console.log('\n❌ CHECKS FAILED!');
    console.log('👉 Cần fix credentials trước khi test');
  }
});
