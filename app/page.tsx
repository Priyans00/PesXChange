import { Hero } from "@/components/pages/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 h-16 px-5">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm">
            PesXChange
          </Link>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </div>
      </nav>

      <div className="flex-1">
        <Hero />
      </div>
    </main>
  );
}
