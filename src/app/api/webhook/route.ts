import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import twilio from 'twilio';

import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Parse expense message in format: amount, category, note
function parseExpenseMessage(message: string) {
  const parts = message.split(',').map((part) => part.trim());
  if (parts.length < 2) {
    throw new Error('Invalid message format');
  }

  const amount = parseFloat(parts[0]);
  if (isNaN(amount)) {
    throw new Error('Invalid amount');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  return {
    amount,
    category: parts[1],
    note: parts[2] || null,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    console.log('formData', formData);

    if (!from || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract WhatsApp number from the 'from' field (remove 'whatsapp:' prefix)
    const whatsappNumber = from.replace('whatsapp:', '');

    // Find user by WhatsApp number
    const user = await prisma.user.findUnique({
      where: { whatsappName: whatsappNumber },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
      // Parse expense message
      const { amount, category, note } = parseExpenseMessage(body);

      // Create expense record
      const expense = await prisma.expense.create({
        data: {
          amount,
          category,
          note,
          userId: user.id,
        },
      });

      // Update Google Sheet
      if (user.sheetId) {
        // TODO: Implement Google Sheets update logic
      }

      // Send confirmation message
      await twilioClient.messages.create({
        body: `Expense recorded:\nAmount: ${amount}\nCategory: ${category}${
          note ? `\nNote: ${note}` : ''
        }`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      // Send error message to user
      await twilioClient.messages.create({
        body: `Error: ${error instanceof Error ? error.message : 'Invalid format'}. Please use format: amount, category, note`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from,
      });

      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
