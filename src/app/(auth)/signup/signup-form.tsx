"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"), "/chains");

  const [accountType, setAccountType] = useState<"professional" | "participant">(
    "professional"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, account_type: accountType } },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // If the Supabase project requires email confirmation, no session
      // exists yet. The profile trigger still creates the application record.
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setNeedsConfirmation(true);
      }
    } catch {
      setError("Account creation is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <p className="text-sm text-muted-foreground">
        Check your email to confirm your account, then come back to this page
        (or your invite link) to continue.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">I&apos;m joining as</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={accountType === "professional"}
            onClick={() => setAccountType("professional")}
            className={`rounded-lg border p-3 text-left transition-colors ${
              accountType === "professional"
                ? "border-primary bg-accent text-accent-foreground"
                : "border-input bg-background hover:bg-secondary"
            }`}
          >
            <Building2 className="mb-2 h-4 w-4" />
            <span className="block text-xs font-semibold">Professional</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Agent or conveyancer
            </span>
          </button>
          <button
            type="button"
            aria-pressed={accountType === "participant"}
            onClick={() => setAccountType("participant")}
            className={`rounded-lg border p-3 text-left transition-colors ${
              accountType === "participant"
                ? "border-primary bg-accent text-accent-foreground"
                : "border-input bg-background hover:bg-secondary"
            }`}
          >
            <UserRound className="mb-2 h-4 w-4" />
            <span className="block text-xs font-semibold">Buyer or seller</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Joining a single chain
            </span>
          </button>
        </div>
      </fieldset>
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Full name
        </label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Priya Shah"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          If you were invited to a chain, use the exact email the invitation
          was sent to.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
