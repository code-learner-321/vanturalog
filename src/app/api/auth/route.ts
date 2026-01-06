import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, name, role, email, action } = body;
    const cookieStore = await cookies();

    if (action === "logout") {
      cookieStore.delete("auth_token");
      cookieStore.delete("user_role");
      cookieStore.delete("user_name");
      cookieStore.delete("user_email");
      return NextResponse.json({ success: true });
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Required for cross-site cookie sending to WordPress
      path: "/",       // Cookie available across the entire site
      maxAge: 60 * 60 * 24 * 365, // 1 year - persist until user manually logs out
    };

    // Set the HttpOnly token (WordPress reads this)
    cookieStore.set("auth_token", token, { ...cookieOptions, httpOnly: true });

    // Set public data (Next.js UI reads this)
    cookieStore.set("user_name", name, { ...cookieOptions, httpOnly: false });
    cookieStore.set("user_role", role, { ...cookieOptions, httpOnly: false });
    if (email) {
      cookieStore.set("user_email", email, { ...cookieOptions, httpOnly: false });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}