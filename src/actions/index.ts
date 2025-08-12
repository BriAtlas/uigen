"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateEmail, validatePassword, sanitizeInput } from "@/lib/validation";

// Simple in-memory store for tracking failed login attempts
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Clean up failed attempts periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = 15 * 60 * 1000; // 15 minutes
  
  for (const [email, data] of failedAttempts.entries()) {
    if (now - data.lastAttempt > cutoff) {
      failedAttempts.delete(email);
    }
  }
}, 60000); // Clean up every minute

function isRateLimited(email: string): boolean {
  const attempts = failedAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  const timeSinceLastAttempt = now - attempts.lastAttempt;
  
  // Block if more than 5 attempts in 15 minutes
  if (attempts.count >= 5 && timeSinceLastAttempt < 15 * 60 * 1000) {
    return true;
  }
  
  return false;
}

function recordFailedAttempt(email: string): void {
  const existing = failedAttempts.get(email);
  failedAttempts.set(email, {
    count: existing ? existing.count + 1 : 1,
    lastAttempt: Date.now(),
  });
}

function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Sanitize inputs
    email = sanitizeInput(email);
    password = sanitizeInput(password);

    // Comprehensive server-side validation
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      return { 
        success: false, 
        error: emailValidation.errors.join(", ") 
      };
    }

    if (!passwordValidation.isValid) {
      return { 
        success: false, 
        error: passwordValidation.errors.join(", ") 
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create session
    await createSession(user.id, user.email);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "An error occurred during sign up" };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Sanitize inputs
    email = sanitizeInput(email);
    password = sanitizeInput(password);

    // Server-side validation  
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: "Invalid email format" };
    }

    // Basic password validation for sign-in (less strict than sign-up)
    if (!password || password.length < 1) {
      return { success: false, error: "Password is required" };
    }

    // Check for rate limiting
    if (isRateLimited(email)) {
      return { 
        success: false, 
        error: "Too many failed attempts. Please try again in 15 minutes." 
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      recordFailedAttempt(email);
      return { success: false, error: "Invalid credentials" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      recordFailedAttempt(email);
      return { success: false, error: "Invalid credentials" };
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);

    // Create session
    await createSession(user.id, user.email);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An error occurred during sign in" };
  }
}

export async function signOut() {
  await deleteSession();
  revalidatePath("/");
  redirect("/");
}

export async function getUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
