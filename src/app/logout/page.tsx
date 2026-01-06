import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  
  // Clear all auth-related cookies
  cookieStore.delete("auth_token");
  cookieStore.delete("user_role");
  cookieStore.delete("user_name");
  cookieStore.delete("user_email");
  
  // Check if this is a manual logout (success) or automatic (session expired)
  // Since we can't read searchParams in server components easily in Next.js 16,
  // we'll default to session_expired for automatic logouts
  // Manual logouts can be handled by checking the referrer or using a different approach
  redirect('/login?error=session_expired');
}

