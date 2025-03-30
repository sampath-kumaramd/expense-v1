import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { whatsappName: phoneNumber, sheetUrl, email } = await request.json();

    // Validate input
    if (!phoneNumber || !sheetUrl || !email) {
      return NextResponse.json(
        { error: 'Phone number, email, and sheet URL are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this phone number or email' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        email,
        sheets: {
          create: {
            name: 'Default Sheet',
            url: sheetUrl,
          },
        },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
