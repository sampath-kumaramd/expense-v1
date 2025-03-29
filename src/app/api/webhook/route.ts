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

// Parse expense message in format: amount category at location
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
    description: location || null,
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
          { phoneNumber: normalizedNumber },
          { phoneNumber: normalizedNumber.replace(/^94/, '0') },
          { phoneNumber: '94' + normalizedNumber.replace(/^0/, '') },
        ],
      },
      include: {
        sheets: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
      // Parse expense message
      const { amount, category, description } = parseExpenseMessage(body);

      // Get the default sheet (first sheet)
      const defaultSheet = user.sheets[0];
      if (!defaultSheet) {
        return NextResponse.json(
          { error: 'No sheet found for user' },
          { status: 400 }
        );
      }

      // Create expense record
      const expense = await prisma.expense.create({
        data: {
          amount,
          category,
          description,
          userId: user.id,
          sheetId: defaultSheet.id,
        },
      });

      // Update Google Sheet
      if (defaultSheet.url) {
        try {
          // Initialize Google Sheets API with service account
          const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(
              process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''
            ),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const sheets = google.sheets({ version: 'v4', auth });

          // Extract sheet ID from URL
          const sheetIdMatch = defaultSheet.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (!sheetIdMatch) {
            console.error('Invalid Google Sheet URL format');
            throw new Error('Invalid Google Sheet URL format');
          }
          const spreadsheetId = sheetIdMatch[1];

          // Prepare the values to append
          const values = [
            [
              new Date().toISOString(),
              amount.toString(),
              category,
              description || '',
            ],
          ];

          // Append values to the sheet
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:D', // Assumes first sheet and columns A-D
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values,
            },
          });
        } catch (error) {
          console.error('Failed to update Google Sheet:', error);
          // Continue with the response as the expense is still recorded in the database
        }
      }

      // Ensure proper WhatsApp number format for Twilio
      const twilioTo = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER
        ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER.replace(/^\+/, '')}`
        : '';

      if (!twilioFrom) {
        console.error('TWILIO_WHATSAPP_NUMBER environment variable is not set');
        return NextResponse.json(
          {
            success: true,
            warning:
              'Expense recorded but confirmation message could not be sent',
          },
          { status: 200 }
        );
      }

      try {
        // Send confirmation message
        await twilioClient.messages.create({
          body: `Expense recorded:\nAmount: ${amount}\nCategory: ${category}${
            description ? `\nDescription: ${description}` : ''
          }`,
          from: twilioFrom,
          to: twilioTo,
        });
      } catch (twilioError) {
        console.error('Failed to send confirmation message:', twilioError);
        // Still return success since the expense was recorded
        return NextResponse.json(
          {
            success: true,
            warning:
              'Expense recorded but confirmation message could not be sent',
          },
          { status: 200 }
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('Parse/DB error:', error);

      // Ensure proper WhatsApp number format for Twilio
      const twilioTo = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER
        ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER.replace(/^\+/, '')}`
        : '';

      if (twilioFrom) {
        try {
          // Send error message to user
          await twilioClient.messages.create({
            body: `Error: ${error instanceof Error ? error.message : 'Invalid format'}. Please use format: amount category at location`,
            from: twilioFrom,
            to: twilioTo,
          });
        } catch (twilioError) {
          console.error('Failed to send error message:', twilioError);
        }
      }

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
