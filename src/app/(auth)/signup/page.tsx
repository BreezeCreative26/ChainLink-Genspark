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
import { SignupForm } from "@/app/(auth)/signup/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.redirect || "/chains");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your ChainLink account</CardTitle>
        <CardDescription>
          Free for buyers, sellers, and anyone joining a single chain as a
          guest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <SignupForm />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center">
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
