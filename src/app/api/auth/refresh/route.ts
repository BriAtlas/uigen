import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { logSessionRefresh } from "@/lib/audit-log";

// Rate limiter for refresh endpoint - more restrictive
const refreshRateLimit = rateLimit({
  limit: 10, // 10 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
  skipInDevelopment: true,
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await refreshRateLimit(req);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many refresh attempts. Please try again later.",
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          "Retry-After": rateLimitResult.retryAfter?.toString() || "900",
        },
      }
    );
  }

  try {
    const newSession = await refreshSession();
    
    if (!newSession) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Log successful session refresh
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const clientId = `${ip}-${userAgent.slice(0, 50)}`;
    
    await logSessionRefresh(newSession.userId, newSession.email, clientId);

    return NextResponse.json({
      success: true,
      user: {
        id: newSession.userId,
        email: newSession.email,
      },
      expiresAt: newSession.expiresAt,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}