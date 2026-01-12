import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, role, email, avatarUrl, userId, action } = body;
    const cookieStore = await cookies();

    if (action === "logout") {
      cookieStore.delete("auth_token");
      cookieStore.delete("user_role");
      cookieStore.delete("user_name");
      cookieStore.delete("user_email");
      cookieStore.delete("user_avatar");
      cookieStore.delete("user_id");
      return NextResponse.json({ success: true });
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year persistence
    };

    // Set HttpOnly token for Server Actions/Verification
    cookieStore.set("auth_token", token, { ...cookieOptions, httpOnly: true });

    // Set Public metadata for UI and Fallback logic
    cookieStore.set("user_name", name || "User", { ...cookieOptions, httpOnly: false });
    cookieStore.set("user_role", role || "subscriber", { ...cookieOptions, httpOnly: false });
    
    // CRITICAL: These prevent the "immediate logout" on network jitter
    if (avatarUrl) {
      cookieStore.set("user_avatar", avatarUrl, { ...cookieOptions, httpOnly: false });
    }
    if (userId) {
      cookieStore.set("user_id", userId.toString(), { ...cookieOptions, httpOnly: false });
    }
    if (email) {
      cookieStore.set("user_email", email, { ...cookieOptions, httpOnly: false });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}