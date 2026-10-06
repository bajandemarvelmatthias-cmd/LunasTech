import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { CheckEmailScreen } from "./CheckEmailScreen";
import { AuthLayout } from "./AuthLayout";

type View =
  | { name: "login" }
  | { name: "signup" }
  | { name: "forgot" }
  | { name: "check-email"; email: string; purpose: "signup" | "recovery" };

// Screens shown before sign-in, inside the split-screen AuthLayout. Log in and
// Sign up share one tab switch; the other screens are single-purpose and have none.
export function AuthFlow() {
  const { linkError } = useAuth();
  const [view, setView] = useState<View>({ name: "login" });
  const toLogin = () => setView({ name: "login" });

  switch (view.name) {
    case "signup":
      return (
        <AuthLayout tab="signup" onTab={(t) => setView(t === "login" ? { name: "login" } : { name: "signup" })}>
          <SignupScreen
            onConfirmationSent={(email) =>
              setView({ name: "check-email", email, purpose: "signup" })
            }
          />
        </AuthLayout>
      );
    case "forgot":
      return (
        <AuthLayout>
          <ForgotPasswordScreen
            onLinkSent={(email) => setView({ name: "check-email", email, purpose: "recovery" })}
            onBack={toLogin}
          />
        </AuthLayout>
      );
    case "check-email":
      return (
        <AuthLayout>
          <CheckEmailScreen email={view.email} purpose={view.purpose} onBack={toLogin} />
        </AuthLayout>
      );
    default:
      return (
        <AuthLayout tab="login" onTab={(t) => setView(t === "login" ? { name: "login" } : { name: "signup" })}>
          <LoginScreen
            notice={linkError}
            onNeedsConfirmation={(email) =>
              setView({ name: "check-email", email, purpose: "signup" })
            }
            onForgotPassword={() => setView({ name: "forgot" })}
          />
        </AuthLayout>
      );
  }
}
