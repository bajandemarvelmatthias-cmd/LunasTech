import type { AuthError } from "@supabase/supabase-js";
import { PASSWORD_MIN_LENGTH } from "./validation";

// Turns a Supabase auth error into one specific sentence for the user.
export function authErrorMessage(error: AuthError): string {
  if (error.name === "AuthRetryableFetchError") {
    return "Can't reach the server. Check your connection and try again.";
  }
  switch (error.code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "over_email_send_rate_limit":
      return "Too many emails were sent. Try again in an hour.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes and try again.";
    case "weak_password":
      return `Password is too weak. Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    case "user_already_exists":
      return "An account with this email already exists. Log in instead.";
    case "signup_disabled":
      return "Sign up is turned off.";
    default:
      return error.message;
  }
}

export const EXISTING_ACCOUNT_MESSAGE =
  "An account with this email already exists. Log in instead.";
