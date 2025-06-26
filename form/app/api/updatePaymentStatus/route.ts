import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { recordId, paymentStatus, sessionId } = await req.json();

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return NextResponse.json({ message: 'Missing Airtable configuration' }, { status: 500 });
    }
    if (!recordId) {
      return NextResponse.json({ message: 'Missing record ID' }, { status: 400 });
    }

    // PATCH request to update the record
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`;

    const updateBody = {
      fields: {
        Payment_Status: paymentStatus,
        Stripe_Session_ID: sessionId,
      },
    };

    const airtableRes = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return NextResponse.json({ message: 'Airtable update failed', error: data }, { status: 500 });
    }

    return NextResponse.json({ message: 'Payment status updated', airtableResponse: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message || error }, { status: 500 });
  }
}