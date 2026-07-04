import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in to ChainLink</CardTitle>
        <CardDescription>
          Access your chains and, if connected, your firm&apos;s dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
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
