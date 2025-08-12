// Client-side validation utilities for security
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  // Trim whitespace
  email = email.trim();
  
  // Basic length check
  if (email.length === 0) {
    errors.push('Email is required');
  } else if (email.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }
  
  // Email format validation (more secure than just HTML5 validation)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (email.length > 0 && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Prevent common injection patterns
  const dangerousPatterns = [
    /<[^>]*>/,  // HTML tags
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i,  // Event handlers
    /\0/,  // Null bytes
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(email)) {
      errors.push('Email contains invalid characters');
      break;
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  // Length requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }
  
  // Strength requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password);
  
  if (!hasLower) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasUpper) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'Password', 'PASSWORD', 'password123', 'Password123',
    '12345678', '87654321', 'qwerty', 'QWERTY', 'qwerty123',
    'admin', 'Admin', 'ADMIN', 'root', 'Root', 'ROOT',
    'user', 'User', 'USER', 'guest', 'Guest', 'GUEST'
  ];
  
  if (commonPasswords.includes(password)) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  // Prevent null bytes and other dangerous characters
  if (password.includes('\0')) {
    errors.push('Password contains invalid characters');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  const errors: string[] = [];
  
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push('Please confirm your password');
    return { isValid: false, errors };
  }
  
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
    .replace(/\0/g, ''); // Remove null bytes
}