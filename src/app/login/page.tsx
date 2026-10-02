import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="ultron-edge h-1 w-8 rounded-full" />
          <span className="font-mono text-sm text-ink-muted">Ultron</span>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
