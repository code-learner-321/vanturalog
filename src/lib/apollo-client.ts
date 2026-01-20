import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const WP_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;

const httpLink = createHttpLink({
  uri: WP_URL,
});

const authLink = setContext(async (_, { headers }) => {
  let token: string | undefined;

  // Check if we are on the Server
  if (typeof window === 'undefined') {
    try {
      // Dynamically import next/headers so the client bundler ignores it
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    } catch (e) {
      console.error("Error fetching cookies on server:", e);
    }
  } else {
    // We are on the Client
    token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='))
      ?.split('=')[1];
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const client = new ApolloClient({
  // Use authLink on both sides now that it's safe
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export async function wpFetch(query: string, variables = {}) {
  try {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include", 
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Server error (${res.status}): ${errorText.substring(0, 200)}`);
    }

    const json = await res.json();
    
    if (json.errors && Array.isArray(json.errors) && json.errors.length > 0) {
      const errorMessage = json.errors.map((e: any) => e.message || JSON.stringify(e)).join(", ");
      throw new Error(errorMessage);
    }
    
    return json.data;
  } catch (error: any) {
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
    }
    throw error;
  }
}