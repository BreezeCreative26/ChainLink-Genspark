"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DashboardBranch } from "@/types/dashboard";

export function FilterBar({ branches }: { branches: DashboardBranch[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", search);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search by Chain ID or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <Select
        className="w-auto"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="stalled">Stalled</option>
        <option value="completed">Completed</option>
        <option value="fallen_through">Fallen through</option>
      </Select>

      {branches.length > 0 && (
        <Select
          className="w-auto"
          value={searchParams.get("branch") ?? ""}
          onChange={(e) => updateParam("branch", e.target.value)}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      )}

      <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={searchParams.get("risk") === "1"}
          onChange={(e) => updateParam("risk", e.target.checked ? "1" : "")}
        />
        At risk only
      </label>
    </div>
  );
}
