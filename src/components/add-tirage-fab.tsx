import Link from "next/link";
import { Plus } from "lucide-react";

export function AddTirageFab() {
  return (
    <Link
      href="/ajouter"
      aria-label="Ajouter un tirage"
      className="fixed z-50 inline-flex size-14 items-center justify-center rounded-full bg-[var(--rose-dust)] text-[var(--primary-foreground)] shadow-[0_12px_28px_rgb(201_145_143_/_0.38)] transition-[transform,background-color,box-shadow] hover:bg-[var(--rose-deep)] hover:shadow-[0_14px_32px_rgb(143_94_92_/_0.32)] active:scale-95 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
    >
      <Plus className="size-6" strokeWidth={2.25} aria-hidden />
    </Link>
  );
}
