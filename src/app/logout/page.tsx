import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  
  // Clear all auth-related cookies
  cookieStore.delete("auth_token");
  cookieStore.delete("user_role");
  cookieStore.delete("user_name");
  cookieStore.delete("user_email");
  
  redirect('/login?error=session_expired');
}

