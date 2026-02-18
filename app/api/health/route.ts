import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      service: 'tendo-api',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        service: 'tendo-api',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'error',
        },
      },
      { status: 500 }
    );
  }
}