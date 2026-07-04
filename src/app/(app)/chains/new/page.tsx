import { PageHeader } from "@/components/layout/page-header";
import { NewChainForm } from "@/app/(app)/chains/new/new-chain-form";

export default function NewChainPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Start a chain"
        description="Create the shared workspace. You can invite everyone else in the chain right away, or add them later."
      />
      <NewChainForm />
    </div>
  );
}
