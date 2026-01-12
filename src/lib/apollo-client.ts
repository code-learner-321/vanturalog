import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const WP_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;

const httpLink = createHttpLink({
  uri: WP_URL,
});

const authLink = setContext((_, { headers }) => {
const your_token_variable = cookieStore.get('auth_token')?.value;
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${your_token_variable}`,
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export async function wpFetch(query: string, variables = {}) {
  try {
    // Use the GraphQL proxy for better error handling and CORS support
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
    // Improve error messages for network errors
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
    }
    throw error;
  }
}