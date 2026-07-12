import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FolderLock, Link2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getDocumentLibrary } from "@/server/services/portfolio";
import { getWorkspaceContext } from "@/server/services/workspace";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/types/chain";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { branch?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceContext(supabase, user.id);
  if (!workspace.showCrossChainTools) redirect("/chains");

  const { documents } = await getDocumentLibrary(supabase, searchParams.branch);
  const internalCount = documents.filter((document) => document.visibility === "internal").length;
  const sharedCount = documents.length - internalCount;

  return (
    <div>
      <PageHeader
        title="Document library"
        description="An RLS-filtered index of documents across your authorised portfolio. Files open from their chain workspace so access is logged at the moment of viewing."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <LibrarySummary label="Visible documents" value={documents.length} icon={FileText} />
        <LibrarySummary label="Shared on chain" value={sharedCount} icon={Link2} />
        <LibrarySummary label="Firm only" value={internalCount} icon={FolderLock} />
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs leading-5 text-teal-950">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Shared documents are visible to authorised chain participants. Firm-only documents remain restricted to members of the owning organisation. The database and Storage policies enforce both rules.</p>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border">
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary"><FileText className="h-5 w-5" /></span>
              <p className="font-semibold text-foreground">No documents in view</p>
              <p className="max-w-md text-sm text-muted-foreground">Upload documents inside a chain workspace. They will appear here only when your participant or firm scope permits it.</p>
            </div>
          ) : (
            <ul>
              {documents.map((document) => (
                <li key={document.id} className="border-b border-border last:border-0">
                  <Link href={`/chains/${document.chain_id}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><FileText className="h-[1.1rem] w-[1.1rem]" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{document.title}</p>
                        <Badge variant={document.visibility === "internal" ? "secondary" : "outline"} className="rounded-full text-[10px]">{document.visibility === "internal" ? "Firm only" : "Shared"}</Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-mono text-primary">{document.chainRef}</span>
                        {document.address && <span>{document.address}</span>}
                        {document.category && <span>{DOCUMENT_CATEGORY_LABELS[document.category as DocumentCategory]}</span>}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-xs text-muted-foreground">{formatFileSize(document.size_bytes)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(document.created_at).toLocaleDateString("en-GB")}</span>
                      <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LibrarySummary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center justify-between p-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold text-foreground">{value}</p></div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="h-4 w-4" /></span>
      </CardContent>
    </Card>
  );
}
