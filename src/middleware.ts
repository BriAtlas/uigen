import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { logUnauthorizedAccess } from "@/lib/audit-log";

export async function middleware(request: NextRequest) {
  const session = await verifySession(request);

  // Create response
  let response = NextResponse.next();

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response = new NextResponse(null, { status: 200 });
    }

    // Set CORS headers
    response.headers.set("Access-Control-Allow-Origin", request.nextUrl.origin); // Same origin only
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    
    // Security headers for API routes
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
  }

  // Protected routes that require authentication
  const protectedPaths = ["/api/projects", "/api/filesystem"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    // Log unauthorized access attempt
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const clientId = `${ip}-${userAgent.slice(0, 50)}`;
    
    await logUnauthorizedAccess(request.nextUrl.pathname, clientId, ip);
    
    const errorResponse = NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
    
    // Copy CORS headers to error response
    if (request.nextUrl.pathname.startsWith("/api/")) {
      errorResponse.headers.set("Access-Control-Allow-Origin", request.nextUrl.origin);
      errorResponse.headers.set("Access-Control-Allow-Credentials", "true");
    }
    
    return errorResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};