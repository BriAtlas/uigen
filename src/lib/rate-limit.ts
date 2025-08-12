// Rate limiting utility for API endpoints
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logRateLimitExceeded, logSuspiciousActivity } from "@/lib/audit-log";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

// Fallback in-memory store for when database is unavailable
const fallbackRateLimitStore = new Map<string, RateLimitEntry>();

// Simple memory cache for suspicious activity detection
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Clean up old entries periodically (both database and fallback)
setInterval(async () => {
  const now = new Date();
  
  // Clean up database entries
  try {
    await prisma.rateLimit.deleteMany({
      where: {
        resetTime: {
          lt: now
        }
      }
    });
  } catch (error) {
    console.error("Failed to clean up rate limit entries from database:", error);
  }
  
  // Clean up fallback store
  const nowMs = Date.now();
  for (const [key, entry] of fallbackRateLimitStore.entries()) {
    if (nowMs > entry.resetTime) {
      fallbackRateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  // Maximum number of requests
  limit: number;
  // Time window in milliseconds  
  windowMs: number;
  // Skip rate limiting in development
  skipInDevelopment?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get user IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Create a hash-like identifier (simplified for demo)
  return `${ip}-${userAgent.slice(0, 50)}`;
}

function getClientInfo(request: NextRequest): { ip: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  return { ip, userAgent };
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<RateLimitResult> => {
    // Skip in development if configured
    if (config.skipInDevelopment && process.env.NODE_ENV === "development") {
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - 1,
        resetTime: Date.now() + config.windowMs,
      };
    }

    const now = Date.now();
    const clientId = getClientIdentifier(request);
    
    try {
      // Try to use database first
      const existingEntry = await prisma.rateLimit.findUnique({
        where: { clientId }
      });

      if (!existingEntry || now > existingEntry.resetTime.getTime()) {
        // First request or window has reset
        const resetTime = new Date(now + config.windowMs);
        
        await prisma.rateLimit.upsert({
          where: { clientId },
          update: {
            count: 1,
            resetTime,
            lastRequest: new Date(now),
          },
          create: {
            clientId,
            count: 1,
            resetTime,
            lastRequest: new Date(now),
          }
        });

        return {
          success: true,
          limit: config.limit,
          remaining: config.limit - 1,
          resetTime: resetTime.getTime(),
        };
      }

      if (existingEntry.count >= config.limit) {
        // Rate limit exceeded - log audit event
        const { ip, userAgent } = getClientInfo(request);
        await logRateLimitExceeded(clientId, request.nextUrl.pathname, ip, userAgent);
        
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          resetTime: existingEntry.resetTime.getTime(),
          retryAfter: Math.ceil((existingEntry.resetTime.getTime() - now) / 1000),
        };
      }

      // Increment counter
      const updatedEntry = await prisma.rateLimit.update({
        where: { clientId },
        data: {
          count: existingEntry.count + 1,
          lastRequest: new Date(now),
        }
      });

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - updatedEntry.count,
        resetTime: updatedEntry.resetTime.getTime(),
      };

    } catch (error) {
      console.error("Database rate limiting failed, falling back to in-memory:", error);
      
      // Fallback to in-memory storage
      const entry = fallbackRateLimitStore.get(clientId);

      if (!entry || now > entry.resetTime) {
        // First request or window has reset
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + config.windowMs,
          lastRequest: now,
        };
        fallbackRateLimitStore.set(clientId, newEntry);

        return {
          success: true,
          limit: config.limit,
          remaining: config.limit - 1,
          resetTime: newEntry.resetTime,
        };
      }

      // Update last request time
      entry.lastRequest = now;

      if (entry.count >= config.limit) {
        // Rate limit exceeded - log audit event
        const { ip, userAgent } = getClientInfo(request);
        await logRateLimitExceeded(clientId, request.nextUrl.pathname, ip, userAgent);
        
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        };
      }

      // Increment counter
      entry.count++;
      fallbackRateLimitStore.set(clientId, entry);

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        resetTime: entry.resetTime,
      };
    }
  };
}

// Additional protection against rapid successive requests
export async function detectSuspiciousActivity(request: NextRequest): Promise<boolean> {
  // Database operations are disabled since rateLimit table doesn't exist in schema
  // Use memory-based suspicious activity detection as fallback
  const clientId = getClientIdentifier(request);
  
  try {
    // Check memory cache for rapid requests
    const now = Date.now();
    const cacheKey = `suspicious:${clientId}`;
    const cachedEntry = memoryCache.get(cacheKey);
    const lastRequest = cachedEntry && now < cachedEntry.expiry ? cachedEntry.value : null;
    
    if (lastRequest && (now - lastRequest) < 100) {
      const { ip, userAgent } = getClientInfo(request);
      await logSuspiciousActivity(clientId, "Rapid successive requests", ip, userAgent);
      return true;
    }
    
    // Store current request time with expiry
    memoryCache.set(cacheKey, { value: now, expiry: now + 1000 });
    return false;
  } catch (error) {
    console.error("Failed to check suspicious activity:", error);
    return false;
  }
}