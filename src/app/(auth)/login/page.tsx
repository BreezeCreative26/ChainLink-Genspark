import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in to ChainLink</CardTitle>
        <CardDescription>
          Access your chains and, if connected, your firm&apos;s dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" type="email" placeholder="you@example.com" disabled />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <Button className="w-full" disabled>
          Log in
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Auth is not wired up yet — this is a foundation-stage placeholder.
        </p>
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
