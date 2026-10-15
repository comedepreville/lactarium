import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, getProfile, isOnboardingComplete } from "@/lib/profile";

/** Auth + données utilisateur : jamais de Full Route Cache partagé. */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }

  const profile = await getProfile(user.id);
  if (!isOnboardingComplete(profile)) {
    redirect("/onboarding");
  }

  return (
    <>
      <SiteHeader displayName={profile?.displayName} />
      <main className="page-shell mx-auto w-full max-w-lg flex-1 px-4 pb-20 pt-5">
        {children}
      </main>
    </>
  );
}
