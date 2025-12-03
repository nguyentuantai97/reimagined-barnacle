import crypto from 'crypto';
import { CukcukLoginRequest, CukcukLoginResponse } from './types';

const CUKCUK_BASE_URL = 'https://graphapi.cukcuk.vn';
const CUKCUK_APP_ID = 'CUKCUKOpenPlatform';

// Token cache
let tokenCache: {
  accessToken: string;
  companyCode: string;
  expiresAt: number;
} | null = null;

/**
 * Generate HMACSHA256 signature for CUKCUK authentication
 * Signature must be hex encoded (not base64)
 */
function generateSignature(params: object, secretKey: string): string {
  const jsonString = JSON.stringify(params);
  return crypto.createHmac('sha256', secretKey).update(jsonString).digest('hex');
}

/**
 * Authenticate with CUKCUK API and get access token
 */
export async function getCukcukToken(): Promise<{
  accessToken: string;
  companyCode: string;
}> {
  const domain = process.env.CUKCUK_DOMAIN;
  const secretKey = process.env.CUKCUK_SECRET_KEY;

  if (!domain || !secretKey) {
    throw new Error('CUKCUK credentials not configured');
  }

  // Check cache (tokens valid for 30 minutes)
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return {
      accessToken: tokenCache.accessToken,
      companyCode: tokenCache.companyCode,
    };
  }

  // LoginTime - try simple ISO format
  const loginTime = new Date().toISOString();

  // Order must be: AppID, Domain, LoginTime (alphabetical order matters for signature)
  const loginParams = {
    AppID: CUKCUK_APP_ID,
    Domain: domain,
    LoginTime: loginTime,
  };

  const signature = generateSignature(loginParams, secretKey);

  const loginRequest: CukcukLoginRequest = {
    ...loginParams,
    SignatureInfo: signature,
  };

  console.log('CUKCUK Login Request:', JSON.stringify(loginRequest, null, 2));

  const response = await fetch(`${CUKCUK_BASE_URL}/api/Account/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginRequest),
  });

  const data: CukcukLoginResponse = await response.json();
  console.log('CUKCUK Login Response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`CUKCUK login failed: ${response.status} - ${data.Message || 'Unknown error'}`);
  }

  if (!data.Success || !data.Data) {
    throw new Error(data.Message || `CUKCUK authentication failed (ErrorType: ${data.ErrorType})`);
  }

  // Cache token for 25 minutes (5 min buffer)
  tokenCache = {
    accessToken: data.Data.AccessToken,
    companyCode: data.Data.CompanyCode,
    expiresAt: now + 25 * 60 * 1000,
  };

  return {
    accessToken: data.Data.AccessToken,
    companyCode: data.Data.CompanyCode,
  };
}

/**
 * Clear token cache (use when token is invalid)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

/**
 * Get CUKCUK API base URL
 */
export function getCukcukBaseUrl(): string {
  return CUKCUK_BASE_URL;
}
