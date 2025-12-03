import { NextRequest, NextResponse } from 'next/server';

// Tọa độ quán AN Milk Tea - 112 Hoàng Phan Thái, Bình Chánh
const SHOP_LOCATION = {
  latitude: 10.6847,
  longitude: 106.6095,
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

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    // Gọi OSRM API từ server (bypass CORS)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${SHOP_LOCATION.longitude},${SHOP_LOCATION.latitude};${longitude},${latitude}?overview=false`;

    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const distanceInKm = data.routes[0].distance / 1000;
      return NextResponse.json({
        success: true,
        distance: distanceInKm,
        source: 'osrm',
      });
    }

    // Fallback: Haversine x 2.5
    const haversine = calculateHaversineDistance(
      SHOP_LOCATION.latitude,
      SHOP_LOCATION.longitude,
      latitude,
      longitude
    );
    return NextResponse.json({
      success: true,
      distance: haversine * 2.5,
      source: 'haversine',
    });
  } catch (error) {
    console.error('Distance API error:', error);

    // Fallback if everything fails
    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}
