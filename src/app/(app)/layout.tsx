import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  getCurrentUser,
  getProfile,
  isOnboardingComplete,
  roleHomePath,
} from "@/lib/profile";

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
  const roleHome = roleHomePath(profile);
  if (roleHome) {
    redirect(roleHome);
  }

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
