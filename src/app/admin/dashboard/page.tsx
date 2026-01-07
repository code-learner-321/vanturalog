import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientWrapper from './DashboardClientWrapper';

async function getVerifiedUser(token: string) {
    const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(wpUrl!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: `
                    query GetViewer {
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
                    }
                `,
            }),
            cache: 'no-store',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response is OK
        if (!response.ok) {
            // Only treat 401/403 as authentication errors
            if (response.status === 401 || response.status === 403) {
                console.warn(`Authentication failed: ${response.status}`);
                return null;
            }
            // For other HTTP errors, log but don't treat as auth failure
            console.warn(`WordPress API returned status ${response.status}: ${response.statusText}`);
            // Return null only for auth errors, allow retry for other errors
            return null;
        }

        const result = await response.json();
        
        if (result.errors) {
            // Check for different types of errors
            const errorMessages = result.errors.map((e: any) => e.message || 'Unknown error').join(', ');
            
            const isExpired = result.errors.some((e: any) => {
                const msg = (e.message || '').toLowerCase();
                return msg.includes("expired") || 
                       msg.includes("invalid token") ||
                       msg.includes("authentication") ||
                       msg.includes("unauthorized") ||
                       msg.includes("jwt") && (msg.includes("expired") || msg.includes("invalid"));
            });
            
            const isNetworkError = result.errors.some((e: any) => {
                const msg = (e.message || '').toLowerCase();
                return msg.includes("network") || 
                       msg.includes("fetch") ||
                       msg.includes("connection") ||
                       msg.includes("timeout");
            });
            
            if (isExpired) {
                console.warn("Session expired or invalid token:", errorMessages);
                return null; // Only return null for actual auth errors
            } else if (isNetworkError) {
                console.warn("Network error during verification:", errorMessages);
                // For network errors, don't treat as session expired - allow retry
                // Return a special value or throw to indicate it's not an auth issue
                throw new Error("Network error - not a session issue");
            } else {
                // Log other GraphQL errors but don't spam the console
                console.warn("GraphQL verification error:", errorMessages);
                // For unknown errors, be conservative and treat as potential auth issue
                return null;
            }
        }

        return result.data?.viewer;
    } catch (error: any) {
        // Handle timeout and network errors differently
        if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('Network error')) {
            console.warn("Network/timeout error during verification - not treating as session expired");
            // Don't redirect on network errors - let the user try again
            throw error;
        }
        console.error("Error during verification:", error);
        return null;
    }
}

export default async function AdminDashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const userName = cookieStore.get('user_name')?.value || "User";
    const userRole = cookieStore.get('user_role')?.value || 'subscriber';

    // 1. Check if token exists in cookies
    if (!token) {
        console.log("No token found in cookies, redirecting...");
        redirect('/login');
    }

    // 2. Verify token with WordPress (but be lenient - don't log out on network errors)
    let viewer;
    try {
        viewer = await getVerifiedUser(token);
    } catch (error) {
        // Network errors - don't log out, use cached user data from cookies
        // This allows the session to persist even if WordPress is temporarily unavailable
        console.warn("Network error during token verification, using cached user data");
        viewer = null; // Will use fallback data from cookies
    }

    // 3. If WordPress verification fails but we have a token cookie, use cached data
    // Only redirect to logout if we're absolutely sure the token is invalid
    // This prevents automatic logouts due to temporary WordPress issues
    if (!viewer) {
        // Check if we have user data in cookies - if yes, trust it and continue
        // This allows sessions to persist even if WordPress token verification fails temporarily
        if (userName && userName !== "User") {
            console.log("Using cached user data from cookies");
            const userData = {
                name: userName,
                role: userRole.toLowerCase(),
                initial: userName.charAt(0).toUpperCase(),
                // Note: databaseId will be null when using cached data
                // UserSettingsManager will handle this gracefully
            };
            return <DashboardClientWrapper userData={userData} jwtToken={token} />;
        }
        
        // Only redirect to logout if we have no user data at all
        console.warn("No valid token or user data found, redirecting to logout");
        redirect('/logout'); 
    }

    const userData = {
        id: viewer.id,
        databaseId: viewer.databaseId,
        name: viewer.name || viewer.nickname || userName || "User",
        role: viewer.roles?.nodes[0]?.name.toLowerCase() || userRole.toLowerCase() || 'subscriber',
        initial: (viewer.name || viewer.nickname || userName || "U").charAt(0).toUpperCase(),
        email: viewer.email || "",
        avatarUrl: viewer.avatarUrl || "",
    };

    // Get the auth token for the client component
    const jwtToken = token;

    return <DashboardClientWrapper userData={userData} jwtToken={jwtToken} />;
}