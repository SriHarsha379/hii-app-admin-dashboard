// ISSUES 7 & 14 FIX: single source of truth for password rules.
// Import validatePassword in Signup.tsx and ResetPassword.tsx.
// Mirror these rules server-side in the Joi/Zod schema for
// /auth/register-organiser and /auth/forget_new_password.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH)
    return 'Password must be at least ' + PASSWORD_MIN_LENGTH + ' characters.';
  if (!PASSWORD_REGEX.test(pw))
    return 'Password must contain an uppercase letter, a lowercase letter, and a number.';
  return null;
}
