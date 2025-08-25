"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState(""); // SRN or PRN
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Handle redirect URL from search params or sessionStorage
  useEffect(() => {
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      sessionStorage.setItem('redirectAfterLogin', redirectTo);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(username, password);
      
      // Success! Redirect to intended page
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/profile';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show error from URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Image
        src="/icon.png"
        alt="PESU Logo"
        width={64}
        height={64}
        className="mx-auto mb-2"
      />
      <h1 className="text-3xl font-bold text-center text-primary">
        Welcome to PesXChange
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your PESU credentials to access the marketplace (pesuacademy app credentials)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">SRN</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="PES1xxxxxxxxx"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your PESU Student Registration Number (SRN)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your PESU Academy password"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in with PESU Account"}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Only PESU students can access this marketplace.
            </p>
            <p className="text-muted-foreground mt-1">
              Use your PESU Academy credentials to sign in.
            </p>
          </div>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have a PESU account?{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                setError("Please contact PESU administration to get your student account.");
              }}
            >
              Contact PESU Administration
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
