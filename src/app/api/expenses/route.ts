import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // TODO: Add authentication and get the user ID from the session
    // For now, we'll just get all expenses
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit the number of results
    });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
