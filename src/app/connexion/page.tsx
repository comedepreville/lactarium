import { AuthForm } from "@/components/auth-form";

export default function ConnexionPage() {
  return (
    <main className="page-shell mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <div className="space-y-8">
        <header className="animate-rise space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Bienvenue
          </p>
          <h1 className="font-display text-5xl tracking-tight text-[var(--rose-deep)]">
            Lactae
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Connectez-vous pour retrouver vos tirages.
          </p>
        </header>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
