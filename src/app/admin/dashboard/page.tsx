import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientWrapper from './DashboardClientWrapper';

async function getVerifiedUser(token: string) {
  const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;

  try {
    const response = await fetch(wpUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `query GetViewer { 
          viewer { 
            id 
            databaseId 
            name 
            nickname 
            email 
            avatarUrl 
            roles { 
              nodes { 
                name 
              } 
            } 
          } 
        }`,
      }),
      cache: 'no-store',
    });

    const result = await response.json();

    if (result.errors) {
      // This will print the actual reason (e.g., "Expired token", "Syntax error")
      console.error("DEBUG - WP Error Message:", JSON.stringify(result.errors, null, 2));
      return null;
    }

    return result.data?.viewer || null;
  } catch (error) {
    console.error("Fetch Check Failed:", error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Read fallbacks from cookies
  const userName = cookieStore.get('user_name')?.value || "User";
  const userRole = cookieStore.get('user_role')?.value || 'subscriber';
  const userId = cookieStore.get('user_id')?.value; 
  const cachedAvatar = cookieStore.get('user_avatar')?.value || "";

  // 1. ONLY redirect if the token is completely missing from cookies
  if (!token) {
    console.log("No token in cookies. Redirecting.");
    redirect('/login');
  }

  // 2. Try to get live data
  const viewer = await getVerifiedUser(token);

  // 3. THE "FORCE STAY" LOGIC
  // If viewer is null (Expired token error), we use fallbacks and STAY on the page.
  if (!viewer) {
    console.warn("WP Token Expired/Error. Forcing Fallback Mode to prevent logout.");
    
    const fallbackData = {
      databaseId: userId ? parseInt(userId.toString()) : 0,
      name: userName,
      role: userRole.toLowerCase(),
      avatarUrl: cachedAvatar,
    };

    // WE RENDER THE DASHBOARD. WE DO NOT REDIRECT.
    return <DashboardClientWrapper userData={fallbackData} jwtToken={token} />;
  }

  // 4. Live data path
  const userData = {
    id: viewer.id,
    databaseId: viewer.databaseId,
    name: viewer.name || viewer.nickname || userName,
    role: viewer.roles?.nodes?.[0]?.name?.toLowerCase() || userRole.toLowerCase(),
    email: viewer.email || "",
    avatarUrl: viewer.avatarUrl || cachedAvatar,
  };

  return <DashboardClientWrapper userData={userData} jwtToken={token} />;
}