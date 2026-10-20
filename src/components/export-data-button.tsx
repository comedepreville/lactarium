"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportDataButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/export", {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error || "Export impossible");
        }

        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition");
        const match = disposition?.match(/filename="([^"]+)"/);
        const filename = match?.[1] ?? "lactae-donnees.csv";

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export impossible");
      }
    });
  }

  return (
    <section className="surface-card animate-rise space-y-3 rounded-[2rem] px-5 py-6 sm:px-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Vos données
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Téléchargez tous vos tirages et entrées de journal au format CSV.
        </p>
      </div>

      <Button
        type="button"
        disabled={pending}
        onClick={handleExport}
        className="h-12 w-full rounded-full bg-[var(--rose-dust)] px-6 text-[var(--primary-foreground)] hover:bg-[var(--rose-deep)]"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Préparation…
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden />
            Télécharger en CSV
          </>
        )}
      </Button>

      {error ? (
        <p className="text-sm text-[#7a3f3d]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
