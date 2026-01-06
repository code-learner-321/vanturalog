"use client";

import { ApolloClient, HttpLink, InMemoryCache, gql, split } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { getMainDefinition } from "@apollo/client/utilities";


export default function AppoloWrapper({ children }: { children: React.ReactNode }) {
    const NEXT_PUBLIC_WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;

    // Link for queries - direct to WordPress (no credentials, no CORS issues)
    const queryLink = new HttpLink({ 
        uri: NEXT_PUBLIC_WP_GRAPHQL_URL,
    });

    // Link for mutations - through proxy (handles credentials server-side, no CORS)
    const mutationLink = new HttpLink({ 
        uri: "/api/graphql",
        credentials: "include"
    });

    // Split link: route queries to direct WordPress, mutations to proxy
    const splitLink = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'mutation'
            );
        },
        mutationLink, // Use proxy for mutations
        queryLink    // Use direct URL for queries
    );

    const client = new ApolloClient({
        link: splitLink,
        cache: new InMemoryCache(),
    });
    return (
        <ApolloProvider client={client}>
            {children}
        </ApolloProvider>
    )
}
