import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";
import { CheckEmailScreen } from "./CheckEmailScreen";

type View =
  | { name: "login" }
  | { name: "signup" }
  | { name: "forgot" }
  | { name: "check-email"; email: string; purpose: "signup" | "recovery" };

// Screens shown before sign-in. Linear flow, one centered column, no navigation.
export function AuthFlow() {
  const { linkError } = useAuth();
  const [view, setView] = useState<View>({ name: "login" });
  const toLogin = () => setView({ name: "login" });

  switch (view.name) {
    case "signup":
      return (
        <SignupScreen
          onConfirmationSent={(email) =>
            setView({ name: "check-email", email, purpose: "signup" })
          }
          onSwitchToLogin={toLogin}
        />
      );
    case "forgot":
      return (
        <ForgotPasswordScreen
          onLinkSent={(email) => setView({ name: "check-email", email, purpose: "recovery" })}
          onBack={toLogin}
        />
      );
    case "check-email":
      return <CheckEmailScreen email={view.email} purpose={view.purpose} onBack={toLogin} />;
    default:
      return (
        <LoginScreen
          notice={linkError}
          onNeedsConfirmation={(email) =>
            setView({ name: "check-email", email, purpose: "signup" })
          }
          onForgotPassword={() => setView({ name: "forgot" })}
          onSwitchToSignup={() => setView({ name: "signup" })}
        />
      );
  }
}
