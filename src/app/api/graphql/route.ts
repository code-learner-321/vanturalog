import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        let token: string | undefined;
        try {
            const cookieStore = await cookies();
            token = cookieStore.get("auth_token")?.value;
        } catch (cookieError: any) {
            // Cookies might not be available in some edge cases
            console.warn("Could not read cookies:", cookieError?.message || cookieError);
        }

        let body: any;
        try {
            body = await req.json();
            // Log mutation requests for debugging
            if (body.query && body.query.includes('mutation')) {
                console.log("=== GraphQL Mutation Request ===");
                console.log("Operation:", body.query.match(/(?:mutation|query)\s+(\w+)/)?.[1] || 'unknown');
                console.log("Variables:", body.variables ? { 
                    ...body.variables, 
                    content: body.variables.content?.substring(0, 100) + (body.variables.content?.length > 100 ? '...' : '')
                } : {});
                console.log("Has Token:", !!token);
            }
        } catch (jsonError: any) {
            console.error("JSON parse error:", jsonError?.message);
            return NextResponse.json(
                { errors: [{ message: "Invalid request body: " + (jsonError?.message || "Unknown error") }] },
                { status: 400 }
            );
        }

        const wpUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL;
        if (!wpUrl) {
            console.error("NEXT_PUBLIC_WP_GRAPHQL_URL is not set");
            return NextResponse.json(
                { errors: [{ message: "WordPress GraphQL URL is not configured. Please set NEXT_PUBLIC_WP_GRAPHQL_URL in your environment variables." }] },
                { status: 500 }
            );
        }

        // Forward cookies from the request to WordPress
        const cookieHeader = req.headers.get("cookie") || "";

        // Update logging with cookie info if it's a mutation
        if (body.query && body.query.includes('mutation')) {
            console.log("Cookie Header:", cookieHeader ? "Present" : "Missing");
        }

        // Build headers object
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Only add Authorization header if token exists
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Only add Cookie header if cookies exist
        if (cookieHeader) {
            headers["Cookie"] = cookieHeader;
        }

        let response: Response;
        try {
            // Log the full request for mutations
            if (body.query && body.query.includes('mutation')) {
                console.log("Sending to WordPress:", wpUrl);
                console.log("Request headers:", JSON.stringify(headers, null, 2));
            }
            
            response = await fetch(wpUrl, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            });
        } catch (fetchError: any) {
            console.error("Failed to fetch from WordPress:", fetchError);
            console.error("Fetch error details:", {
                name: fetchError.name,
                message: fetchError.message,
                stack: fetchError.stack
            });
            
            // Provide more specific error messages
            let errorMsg = "Network error";
            if (fetchError.message?.includes("fetch")) {
                errorMsg = "Unable to connect to WordPress server. Please check if the WordPress GraphQL endpoint is accessible.";
            } else if (fetchError.message) {
                errorMsg = fetchError.message;
            }
            
            return NextResponse.json(
                { errors: [{ message: `Failed to connect to WordPress: ${errorMsg}` }] },
                { status: 500 }
            );
        }

        if (!response.ok) {
            let errorText = "";
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = "Unable to read error response";
            }
            
            console.error("=== WordPress GraphQL HTTP Error ===");
            console.error("Status:", response.status);
            console.error("Status Text:", response.statusText);
            console.error("Full Error Response:", errorText);
            
            // Try to parse as JSON to get GraphQL errors
            let errorData: any = null;
            try {
                errorData = JSON.parse(errorText);
                console.error("Parsed Error Data:", JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.error("Error response is not JSON, raw text:", errorText.substring(0, 500));
            }
            
            // If we have GraphQL errors in the response, return them
            if (errorData && errorData.errors) {
                console.error("GraphQL Errors found:", JSON.stringify(errorData.errors, null, 2));
                return NextResponse.json(
                    { errors: errorData.errors },
                    { status: 200 } // GraphQL errors are returned with 200
                );
            }
            
            // Otherwise return HTTP error with full details
            const errorMessage = errorData?.message || errorText.substring(0, 500) || response.statusText || "Unknown error";
            console.error("Returning error to client:", errorMessage);
            return NextResponse.json(
                { errors: [{ message: `WordPress API error (${response.status}): ${errorMessage}` }] },
                { status: response.status }
            );
        }

        let data;
        try {
            data = await response.json();
            
            // Log the full response for debugging mutations
            if (body.query && body.query.includes('mutation')) {
                console.log("=== WordPress GraphQL Response ===");
                console.log(JSON.stringify(data, null, 2));
            }
            
            // Check if WordPress returned GraphQL errors
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                console.error("WordPress GraphQL Errors:", JSON.stringify(data.errors, null, 2));
                // Return the actual GraphQL errors from WordPress
                return NextResponse.json(data, { status: 200 }); // Still 200 because GraphQL errors are in the response
            }
        } catch (jsonError: any) {
            console.error("Failed to parse WordPress response:", jsonError?.message);
            const responseText = await response.text().catch(() => 'Unable to read response');
            console.error("Raw WordPress response:", responseText.substring(0, 500));
            return NextResponse.json(
                { errors: [{ message: "Failed to parse WordPress response: " + (jsonError?.message || "Unknown error") }] },
                { status: 500 }
            );
        }
        
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("GraphQL Proxy Error:", error);
        const errorMessage = error?.message || error?.toString() || "Internal server error";
        const errorStack = error?.stack ? `\nStack: ${error.stack}` : "";
        console.error("Full error:", errorMessage + errorStack);
        
        return NextResponse.json(
            { errors: [{ message: `GraphQL Proxy Error: ${errorMessage}` }] },
            { status: 500 }
        );
    }
}