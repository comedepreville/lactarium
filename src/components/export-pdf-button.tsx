"use client";

import { useState, useTransition } from "react";
import { Share2, Loader2 } from "lucide-react";
import type { TiragesExportReport } from "@/lib/export-report";
import { MIN_TIRAGES_FOR_EXPORT } from "@/lib/export-report";
import { cn } from "@/lib/utils";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportPdfButton({
  report,
  tirageCount,
  className,
}: {
  report: TiragesExportReport | null;
  tirageCount: number;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const disabled = tirageCount < MIN_TIRAGES_FOR_EXPORT || !report || pending;

  function handleExport() {
    if (!report) return;
    setError(null);
    startTransition(async () => {
      try {
        const { generateTiragesPdfBlob, tiragesPdfFilename } = await import(
          "@/lib/pdf/generate-tirages-pdf"
        );
        const blob = await generateTiragesPdfBlob(report);
        const filename = tiragesPdfFilename(report);
        const file = new File([blob], filename, { type: "application/pdf" });

        const canShareFiles =
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] });

        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: `Tirages Lactae — ${report.displayName}`,
              text: report.rangeLabel,
            });
            return;
          } catch (shareError) {
            if (
              shareError instanceof DOMException &&
              shareError.name === "AbortError"
            ) {
              return;
            }
            // Continuer vers le téléchargement si le partage échoue
          }
        }

        downloadBlob(blob, filename);
      } catch (exportError) {
        console.error(exportError);
        setError("Impossible de générer le PDF. Réessaie dans un instant.");
      }
    });
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        title={
          tirageCount < MIN_TIRAGES_FOR_EXPORT
            ? `Au moins ${MIN_TIRAGES_FOR_EXPORT} tirages sont nécessaires pour exporter`
            : "Partager ou télécharger le PDF des tirages"
        }
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-[var(--rose-dust)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[0_8px_20px_rgb(201_145_143_/_0.28)] transition-[transform,background-color,opacity] hover:bg-[var(--rose-deep)] active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:scale-100",
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Share2 className="size-4" aria-hidden />
        )}
        {pending ? "Génération…" : "Exporter en PDF"}
      </button>
      {tirageCount < MIN_TIRAGES_FOR_EXPORT ? (
        <p className="px-1 text-xs text-[var(--ink-muted)]">
          Disponible à partir de {MIN_TIRAGES_FOR_EXPORT} tirages (
          {tirageCount}/{MIN_TIRAGES_FOR_EXPORT}).
        </p>
      ) : null}
      {error ? (
        <p className="px-1 text-xs text-[var(--rose-deep)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
