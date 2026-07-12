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
import { SignupForm } from "@/app/(auth)/signup/signup-form";
import { AuthConfigurationNotice } from "@/components/auth/auth-configuration-notice";

export default async function SignupPage({
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

    if (user) {
      redirect(safeRedirectPath(searchParams.redirect, "/chains"));
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-[0_24px_70px_-30px_rgba(15,45,51,0.35)]">
      <CardHeader className="p-7 pb-5 sm:p-8 sm:pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Start with clarity</p>
        <CardTitle className="font-display text-3xl font-semibold tracking-tight">Create your ChainLink account</CardTitle>
        <CardDescription>
          Free for buyers, sellers, and anyone joining a single chain as a
          guest.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-7 sm:px-8">
        {configured ? (
          <Suspense>
            <SignupForm />
          </Suspense>
        ) : (
          <AuthConfigurationNotice />
        )}
      </CardContent>
      <CardFooter className="justify-center px-7 pb-7 sm:px-8 sm:pb-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
