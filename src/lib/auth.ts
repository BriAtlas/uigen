import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Generate a secure JWT secret
function generateJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // In development, generate a random secret
    if (process.env.NODE_ENV === "development") {
      const crypto = require("crypto");
      const randomSecret = crypto.randomBytes(32).toString("base64");
      console.warn("⚠️  JWT_SECRET not set. Using random secret for development only.");
      console.warn("⚠️  Set JWT_SECRET environment variable for production!");
      return new TextEncoder().encode(randomSecret);
    } else {
      // In production, require the secret
      throw new Error("JWT_SECRET environment variable is required in production");
    }
  }
  
  // Validate secret strength
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = generateJWTSecret();

const ACCESS_TOKEN_COOKIE = "auth-token";
const REFRESH_TOKEN_COOKIE = "refresh-token";

export interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: Date;
  tokenType?: "access" | "refresh";
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  expiresAt: Date;
  tokenType: "refresh";
}

export async function createSession(userId: string, email: string) {
  // Access token - shorter lived (1 hour)
  const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const accessSession: SessionPayload = { 
    userId, 
    email, 
    expiresAt: accessExpiresAt,
    tokenType: "access" 
  };

  // Refresh token - longer lived (7 days)
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const refreshSession: RefreshTokenPayload = { 
    userId, 
    email, 
    expiresAt: refreshExpiresAt,
    tokenType: "refresh" 
  };

  const accessToken = await new SignJWT({ ...accessSession })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ ...refreshSession })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  
  // Set access token cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: accessExpiresAt,
    path: "/",
    maxAge: 60 * 60, // 1 hour in seconds
    priority: "high",
  });

  // Set refresh token cookie
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: refreshExpiresAt,
    path: "/auth", // Restrict to auth endpoints only
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    priority: "high",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload as unknown as SessionPayload;
    
    // Ensure it's an access token
    if (session.tokenType && session.tokenType !== "access") {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

export async function refreshSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(refreshToken, JWT_SECRET);
    const refreshPayload = payload as unknown as RefreshTokenPayload;
    
    // Ensure it's a refresh token
    if (refreshPayload.tokenType !== "refresh") {
      return null;
    }

    // Check if refresh token is still valid
    if (new Date() > new Date(refreshPayload.expiresAt)) {
      return null;
    }

    // Create new access token
    const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const newAccessSession: SessionPayload = { 
      userId: refreshPayload.userId, 
      email: refreshPayload.email, 
      expiresAt: accessExpiresAt,
      tokenType: "access" 
    };

    const newAccessToken = await new SignJWT({ ...newAccessSession })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Update access token cookie
    cookieStore.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: accessExpiresAt,
      path: "/",
      maxAge: 60 * 60, // 1 hour in seconds
      priority: "high",
    });

    return newAccessSession;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  
  // Delete access token cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire immediately
    path: "/",
    maxAge: 0,
  });

  // Delete refresh token cookie
  cookieStore.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0), // Expire immediately
    path: "/auth",
    maxAge: 0,
  });
}

export async function verifySession(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload as unknown as SessionPayload;
    
    // Ensure it's an access token
    if (session.tokenType && session.tokenType !== "access") {
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}

// Enhanced session verification that attempts refresh if access token is expired
export async function verifyOrRefreshSession(
  request: NextRequest
): Promise<SessionPayload | null> {
  // First try to verify the access token
  const session = await verifySession(request);
  if (session) {
    return session;
  }

  // If access token is invalid/expired, try to refresh
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(refreshToken, JWT_SECRET);
    const refreshPayload = payload as unknown as RefreshTokenPayload;
    
    // Ensure it's a refresh token
    if (refreshPayload.tokenType !== "refresh") {
      return null;
    }

    // Check if refresh token is still valid
    if (new Date() > new Date(refreshPayload.expiresAt)) {
      return null;
    }

    // Return the session info from refresh token (without creating new tokens in middleware)
    return {
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      tokenType: "access"
    };
  } catch (error) {
    return null;
  }
}
