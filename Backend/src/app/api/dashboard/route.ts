import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch stats
    const [
      totalVehicles,
      totalCapacityRaw,
      scansToday,
      activeAgents,
      parkings,
      recentScans
    ] = await Promise.all([
      db.user.count({ where: { presenceStatus: 'IN' } }),
      db.parkingZone.aggregate({ _sum: { capacity: true } }),
      db.accessLog.count({ where: { timestamp: { gte: startOfDay } } }),
      db.agent.count({ where: { status: 'ACTIVE' } }),
      db.parkingZone.findMany(),
      db.accessLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' },
        include: { user: true, parking: true }
      })
    ]);

    const totalCapacity = totalCapacityRaw._sum.capacity || 0;
    const currentVehiclesInParking = parkings.reduce((sum, p) => sum + p.currentCount, 0);
    const freeSpaces = Math.max(0, totalCapacity - currentVehiclesInParking);

    // Format parking data for the frontend mapping
    const parkingData: Record<string, any> = {};
    parkings.forEach(p => {
      // Create a slug-like key based on type or name for frontend mapping
      // In frontend, it uses keys like 'zone-a', 'ecopo', 'zone-b', 'church'
      let key = '';
      const name = p.name.toLowerCase();
      if (name.includes('ecopo')) key = 'ecopo';
      else if (name.includes('a') && name.includes('zone')) key = 'zone-a';
      else if (name.includes('b') && name.includes('zone')) key = 'zone-b';
      else if (name.includes('gym') || name.includes('église') || name.includes('church')) key = 'church';
      else key = p.name.toLowerCase().replace(/\s+/g, '-');

      parkingData[key] = {
        current: p.currentCount,
        total: p.capacity,
        id: p.id,
        name: p.name
      };
    });

    const formattedScans = recentScans.map(scan => {
      const diffMs = new Date().getTime() - new Date(scan.timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeStr = `Il y a ${diffMins} min`;
      if (diffMins === 0) timeStr = `À l'instant`;
      else if (diffMins > 60) {
        const diffHours = Math.floor(diffMins / 60);
        timeStr = `Il y a ${diffHours} h`;
      }

      return {
        id: scan.id,
        name: scan.user?.name || scan.userNameSnapshot || 'Inconnu',
        profile: scan.user?.profile || 'Visiteur',
        type: scan.eventType,
        parking: scan.parking?.name || 'Inconnu',
        status: scan.status,
        reason: scan.failReason || null,
        time: timeStr,
        timestamp: scan.timestamp
      };
    });

    return NextResponse.json({
      stats: {
        totalVehicles,
        freeSpaces,
        scansToday,
        activeAgents
      },
      parkings: parkings.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        current: p.currentCount,
        total: p.capacity,
      })),
      parkingData,
      recentScans: formattedScans
    });

  } catch (error) {
    console.error('[DASHBOARD_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
