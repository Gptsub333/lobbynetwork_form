// app/api/submitToAirtable/route.ts

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      firstName,
      lastName,
      email,
      subscriptionTier,
      addOns,
      mobileNumber,
      companyName,
      companyWebsite,
      hearAboutUs,
      total,
    } = body
    console.log(body)
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      console.error('❌ Missing environment variables')
      return NextResponse.json(
        { message: 'Missing Airtable configuration' },
        { status: 500 }
      )
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`

    const record = {
      fields: {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        SubscriptionTier: subscriptionTier,
        AddOns: addOns?.join(', '),
        MobileNumber: mobileNumber,
        CompanyName: companyName,
        CompanyWebsite: companyWebsite,
        HearAboutUs: hearAboutUs,
        Total: total,
        SubmissionDate: new Date().toISOString().split('T')[0],
      },
    }

    const airtableRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    })

    const data = await airtableRes.json()

    if (!airtableRes.ok) {
      console.error(' Airtable API error:', data)
      return NextResponse.json(
        { message: 'Airtable submission failed', error: data },
        { status: 500 }
      )
    }

    console.log('Airtable record created:', data)
    return NextResponse.json({ message: 'Success', airtableResponse: data }, { status: 200 })
  } catch (error: any) {
    console.error(' Server Error:', error.message || error)
    return NextResponse.json(
      { message: 'Server error', error: error.message || error },
      { status: 500 }
    )
  }
}
