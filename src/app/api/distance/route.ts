import { NextRequest, NextResponse } from 'next/server';
import { sanitizeString, detectAttackPatterns } from '@/lib/security';
import { recordSecurityIncident } from '@/lib/security/auto-heal';

// Tọa độ quán AN Milk Tea - 112 Đường Hoàng Phan Thái, Bình Chánh
const SHOP_LOCATION = {
  latitude: 10.666694951717572,
  longitude: 106.56490596564488,
};

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
 * Geocode địa chỉ thành tọa độ GPS bằng Nominatim (OpenStreetMap)
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Thêm "Hồ Chí Minh" để tăng độ chính xác
    const searchAddress = address.includes('Hồ Chí Minh') || address.includes('HCM')
      ? address
      : `${address}, Hồ Chí Minh, Việt Nam`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ANMilkTea/1.0 (anmilktea.online)',
      },
    });

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Tính khoảng cách đường đi bằng OSRM
 * Chiều: từ quán (SHOP) đến khách hàng (customer) - đúng chiều ship
 */
async function calculateOSRMDistance(customerLat: number, customerLon: number): Promise<number | null> {
  try {
    // OSRM format: /route/v1/driving/lon1,lat1;lon2,lat2
    // Điểm đầu: Quán (SHOP_LOCATION) -> Điểm cuối: Khách hàng (customer)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${SHOP_LOCATION.longitude},${SHOP_LOCATION.latitude};${customerLon},${customerLat}?overview=false`;

    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000;
    }

    return null;
  } catch {
    return null;
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    const body = await request.json();
    let { latitude, longitude, address } = body;

    // Sanitize address input
    if (address) {
      address = sanitizeString(address, 500);

      // Detect attack patterns
      if (detectAttackPatterns(address)) {
        recordSecurityIncident('sql_injection', 'high', clientIP, {
          endpoint: '/api/distance',
          address: address.substring(0, 100),
        });

        return NextResponse.json(
          { success: false, error: 'Địa chỉ không hợp lệ' },
          { status: 400 }
        );
      }
    }

    let customerLat = latitude;
    let customerLon = longitude;

    // Nếu không có tọa độ GPS nhưng có địa chỉ, geocode địa chỉ
    if ((!customerLat || !customerLon) && address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        customerLat = coords.lat;
        customerLon = coords.lon;
      } else {
        return NextResponse.json({
          success: false,
          error: 'Không tìm thấy địa chỉ. Vui lòng nhập chi tiết hơn hoặc dùng GPS.',
        });
      }
    }

    if (!customerLat || !customerLon) {
      return NextResponse.json(
        { error: 'Missing latitude/longitude or address' },
        { status: 400 }
      );
    }

    // Tính khoảng cách bằng OSRM
    const osrmDistance = await calculateOSRMDistance(customerLat, customerLon);

    if (osrmDistance !== null) {
      return NextResponse.json({
        success: true,
        distance: osrmDistance,
        coordinates: { latitude: customerLat, longitude: customerLon },
        source: 'osrm',
      });
    }

    // Fallback: Haversine x 2.5
    const haversine = calculateHaversineDistance(
      SHOP_LOCATION.latitude,
      SHOP_LOCATION.longitude,
      customerLat,
      customerLon
    );
    return NextResponse.json({
      success: true,
      distance: haversine * 2.5,
      coordinates: { latitude: customerLat, longitude: customerLon },
      source: 'haversine',
    });
  } catch (error) {
    console.error('Distance API error:', error);

    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}
