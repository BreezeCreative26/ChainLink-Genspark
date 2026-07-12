import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AuthConfigurationNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="text-sm font-semibold">Account access is being configured</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            This deployment is online, but its Supabase environment variables are
            not available yet. Add the required variables in Vercel and redeploy;
            this page will become active automatically.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-amber-900/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              NEXT_PUBLIC_SUPABASE_URL
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
