import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser, getProfile, isAdmin } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const profile = await getProfile(user.id);
  if (!isAdmin(profile)) {
    redirect("/");
  }

  return (
    <>
      <header className="page-shell sticky top-0 z-40">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="font-display text-2xl tracking-tight text-[var(--rose-deep)]">
              Lactae
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Administration
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="page-shell mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-5">
        {children}
      </main>
    </>
  );
}
