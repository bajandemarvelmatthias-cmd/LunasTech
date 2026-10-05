import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { CheckEmailScreen } from "./CheckEmailScreen";

type View =
  | { name: "login" }
  | { name: "signup" }
  | { name: "check-email"; email: string };

// Screens shown before sign-in. Linear flow, one centered column, no navigation.
export function AuthFlow() {
  const { linkError } = useAuth();
  const [view, setView] = useState<View>({ name: "login" });

  switch (view.name) {
    case "signup":
      return (
        <SignupScreen
          onConfirmationSent={(email) => setView({ name: "check-email", email })}
          onSwitchToLogin={() => setView({ name: "login" })}
        />
      );
    case "check-email":
      return (
        <CheckEmailScreen email={view.email} onBack={() => setView({ name: "login" })} />
      );
    default:
      return (
        <LoginScreen
          notice={linkError}
          onNeedsConfirmation={(email) => setView({ name: "check-email", email })}
          onSwitchToSignup={() => setView({ name: "signup" })}
        />
      );
  }
}
