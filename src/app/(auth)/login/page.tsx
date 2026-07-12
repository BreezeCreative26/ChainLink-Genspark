import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthConfigurationNotice } from "@/components/auth/auth-configuration-notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Already signed in — honour local ?redirect= paths (e.g. an invite
    // link), but never allow an external open redirect.
    if (user) {
      redirect(safeRedirectPath(searchParams.redirect, "/chains"));
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-[0_24px_70px_-30px_rgba(15,45,51,0.35)]">
      <CardHeader className="p-7 pb-5 sm:p-8 sm:pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Welcome back</p>
        <CardTitle className="font-display text-3xl font-semibold tracking-tight">Log in to ChainLink</CardTitle>
        <CardDescription>
          Access your chains and, if connected, your firm&apos;s dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-7 sm:px-8">
        {configured ? (
          <Suspense>
            <LoginForm />
          </Suspense>
        ) : (
          <AuthConfigurationNotice />
        )}
      </CardContent>
      <CardFooter className="justify-center px-7 pb-7 sm:px-8 sm:pb-8">
        <p className="text-sm text-muted-foreground">
          New to ChainLink?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
