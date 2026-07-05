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
import { LoginForm } from "@/app/(auth)/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in — honour ?redirect= (e.g. an invite link) if
  // present, otherwise send them somewhere useful rather than re-showing
  // the login form.
  if (user) {
    redirect(searchParams.redirect || "/chains");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in to ChainLink</CardTitle>
        <CardDescription>
          Access your chains and, if connected, your firm&apos;s dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Invited to a chain?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Use your invite link instead
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
