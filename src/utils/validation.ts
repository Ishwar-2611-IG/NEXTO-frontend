
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_FORMAT = /^\+?[\d\s()-]+$/;

export const isEmail = (value: string): boolean => {
  const email = value.trim();

  return email.length <= 254 && EMAIL.test(email);
};

export const isEmailOrPhone = (value: string): boolean => {
  const input = value.trim();

  if (isEmail(input)) {
    return true;
  }

  if (!PHONE_FORMAT.test(input)) {
    return false;
  }

  // Count digits only, ignoring spaces, brackets, and separators.
  const digits = input.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15;
};

export interface LoginErrors {
  name?: string;
  identifier?: string;
  password?: string;
}

export function validateLogin(
  identifier: string,
  password: string,
  mode: "signin" | "signup",
): LoginErrors {
  const errors: LoginErrors = {};

  if (!identifier.trim()) {
    errors.identifier = "Enter your email address.";
  } else if (!isEmail(identifier)) {
    errors.identifier = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  } else if (mode === "signup" && password.length < 8) {
    errors.password = "Use at least 8 characters.";
  } else if (mode === "signup" && !/\p{L}/u.test(password)) {
    errors.password = "Include at least one letter.";
  } else if (mode === "signup" && !/\d/.test(password)) {
    errors.password = "Include at least one number.";
  } else if (new TextEncoder().encode(password).length > 72) {
    errors.password = "Password must not exceed 72 bytes.";
  }

  return errors;
}

export interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function validateContact(
  name: string,
  email: string,
  message: string,
): ContactErrors {
  const errors: ContactErrors = {};

  if (name.trim().length < 2) {
    errors.name = "Please enter at least 2 characters for your name.";
  }

  if (!isEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (message.trim().length < 10) {
    errors.message =
      "Tell us a little more (at least 10 characters).";
  }

  return errors;
}
