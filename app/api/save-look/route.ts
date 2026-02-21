import { NextRequest, NextResponse } from "next/server";

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbw4KGNwKEJmz15HUQbuvy5swFwNhfj13WoGg2ChCV97ek4PV1_DIUiUOVKoRp2H3yO3/exec";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const res = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Google Sheets failed");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SAVE LOOK ERROR:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}