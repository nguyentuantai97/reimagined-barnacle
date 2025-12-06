import { NextResponse } from 'next/server';
import { isCukcukConfigured, fetchCukcukBranches } from '@/lib/cukcuk/client';
import { getCukcukToken, getCukcukBaseUrl } from '@/lib/cukcuk/auth';

export async function GET() {
  // Block debug endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  const result: Record<string, unknown> = {
    configured: isCukcukConfigured(),
    domain: process.env.CUKCUK_DOMAIN ? 'SET' : 'NOT SET',
    secretKey: process.env.CUKCUK_SECRET_KEY ? 'SET (length: ' + process.env.CUKCUK_SECRET_KEY.length + ')' : 'NOT SET',
  };

  if (isCukcukConfigured()) {
    try {
      const tokenResult = await getCukcukToken();
      result.tokenSuccess = true;
      result.companyCode = tokenResult.companyCode;
      result.baseUrl = getCukcukBaseUrl();
      result.tokenPreview = tokenResult.accessToken.substring(0, 20) + '...';

      // Fetch branches to verify API connection
      const branchesResult = await fetchCukcukBranches();
      result.branchesResult = branchesResult;
    } catch (error) {
      result.tokenSuccess = false;
      result.tokenError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json(result);
}
