import Link from "next/link";

import { LogoWithWordmark } from "@/components/layout/logo-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary/40 px-4">
      <Link href="/" className="mb-8">
        <LogoWithWordmark />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
