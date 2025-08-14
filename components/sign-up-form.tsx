"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [name, setName] = useState("");
  const [srn, setSrn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [srnError, setSrnError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSrnValid, setIsSrnValid] = useState(false);
  const router = useRouter();

  const validateSrn = async (srnValue: string) => {
    if (!srnValue) {
      setSrnError("SRN is required");
      setIsSrnValid(false);
      return;
    }

    // Validate SRN format
    const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
    if (!srnPattern.test(srnValue)) {
      setSrnError("Invalid SRN format. Expected: PES2UG24CS453");
      setIsSrnValid(false);
      return;
    }

    try {
      const response = await fetch('/api/check-srn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ srn: srnValue }),
      });

      const data = await response.json();

      if (data.exists) {
        setSrnError(data.error);
        setIsSrnValid(false);
      } else {
        setSrnError(null);
        setIsSrnValid(true);
      }
    } catch (error) {
      setSrnError("Error validating SRN");
      setIsSrnValid(false);
      console.error("SRN validation error:", error);
    }
  };

  const handleSrnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSrn(value);
    
    // Debounce validation
    if (value.length >= 13) {
      setTimeout(() => validateSrn(value), 500);
    } else {
      setSrnError(null);
      setIsSrnValid(false);
    }
  };

  // Profile creation deferred until after email confirmation
  // const createUserProfile = async () => { ... }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      setIsLoading(false);
      return;
    }

    if (!isSrnValid || !srn) {
      setError("Please enter a valid and unique SRN");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // First, sign up the user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/auth/complete-profile')}`,
        },
      });

      if (signUpError) throw signUpError;

      // Don't create profile immediately - wait for email confirmation
      // Profile will be created after email confirmation in the complete-profile page
      router.push("/auth/sign-up-success");
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/complete-profile`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Image
        src="/icon.png"
        alt="Logo"
        width={64}
        height={64}
        className="mx-auto mb-2"
      />
      <h1 className="text-3xl font-bold text-center text-primary">
        Welcome to PesXChange
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="srn">SRN (Student Registration Number)</Label>
                <Input
                  id="srn"
                  type="text"
                  placeholder="PES2UG24CS453"
                  required
                  value={srn}
                  onChange={handleSrnChange}
                  className={srnError ? "border-red-500" : isSrnValid ? "border-green-500" : ""}
                />
                {srnError && <p className="text-sm text-red-500">{srnError}</p>}
                {isSrnValid && <p className="text-sm text-green-500">✓ SRN is valid and available</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading || !isSrnValid}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                Continue with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
