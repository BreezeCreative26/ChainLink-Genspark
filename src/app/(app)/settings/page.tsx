import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your account, and — if connected — your firm's settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Profile, email, and password management will live here.</p>
            <Separator />
            <p>Not yet wired to Supabase Auth — foundation stage only.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Firm details, branches, and team members will appear here once
              organizations are implemented (Phase 2, per docs/ROADMAP.md).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
