import { google } from 'googleapis';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        expenses: {
          include: {
            sheet: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user.expenses);
  } catch (error) {
    console.error('[EXPENSES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await req.json();
    const { amount, category, description, sheetId, date } = body;

    if (!amount || !category || !sheetId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create the expense in database
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId: user.id,
        sheetId,
      },
    });

    // Get the sheet details
    const sheet = await prisma.sheet.findUnique({
      where: { id: sheetId },
    });

    if (sheet?.url) {
      // Initialize Google Sheets API
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Extract sheet ID from URL
      const spreadsheetId = sheet.url.match(/[-\w]{25,}/)?.[0];

      if (spreadsheetId) {
        // Append the expense to the sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A:E',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                new Date(expense.date).toLocaleDateString(),
                expense.amount,
                expense.category,
                expense.description || '',
              ],
            ],
          },
        });
      }
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('[EXPENSES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
