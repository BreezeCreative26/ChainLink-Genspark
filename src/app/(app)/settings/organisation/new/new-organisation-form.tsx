"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createOrganisationAction } from "@/app/(app)/settings/organisation/actions";
import type { Database } from "@/types/database";

type OrgType = Database["public"]["Tables"]["organisations"]["Row"]["org_type"];

export function NewOrganisationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("estate_agency");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createOrganisationAction({ name, orgType });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/settings");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Firm name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Blake & Co. Estate Agents"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Firm type</label>
        <Select value={orgType} onChange={(e) => setOrgType(e.target.value as OrgType)}>
          <option value="estate_agency">Estate agency</option>
          <option value="conveyancing_firm">Conveyancing firm</option>
          <option value="other">Other</option>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create firm"}
      </Button>
    </form>
  );
}
