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
  // Remove 'Expense:' prefix if present and trim
  const cleanMessage = message.replace(/^Expense:\s*/i, '').trim();

  // Split by 'at' first to separate location
  const [mainPart, location] = cleanMessage
    .split(/\s+at\s+/)
    .map((part) => part?.trim());
  if (!mainPart) {
    throw new Error('Invalid message format');
  }

  // Split the main part by spaces to get amount and category
  const parts = mainPart.split(/\s+/);
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

  // Join the remaining parts as category
  const category = parts.slice(1).join(' ');

  return {
    amount,
    category,
    note: location || null,
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

    // Normalize the phone number by removing '+' and any leading zeros
    const normalizedNumber = whatsappNumber
      .replace(/^\+/, '')
      .replace(/^0/, '');

    // Find user by WhatsApp number, trying both formats
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { whatsappName: normalizedNumber },
          { whatsappName: normalizedNumber.replace(/^94/, '0') }, // Convert international to local format
          { whatsappName: '94' + normalizedNumber.replace(/^0/, '') }, // Convert local to international format
        ],
      },
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

      // Ensure proper WhatsApp number format for Twilio
      const twilioTo = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const twilioFrom = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

      // Send confirmation message
      await twilioClient.messages.create({
        body: `Expense recorded:\nAmount: ${amount}\nCategory: ${category}${
          note ? `\nNote: ${note}` : ''
        }`,
        from: twilioFrom,
        to: twilioTo,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Parse/DB error:', error);

      // Ensure proper WhatsApp number format for Twilio
      const twilioTo = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const twilioFrom = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

      // Send error message to user
      await twilioClient.messages.create({
        body: `Error: ${error instanceof Error ? error.message : 'Invalid format'}. Please use format: amount category at location`,
        from: twilioFrom,
        to: twilioTo,
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
