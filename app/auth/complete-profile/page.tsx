"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [srn, setSrn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [srnError, setSrnError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSrnValid, setIsSrnValid] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      
      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        router.push('/protected');
      }
    };

    checkUser();
  }, [router]);

  const validateSrn = async (srnValue: string) => {
    if (!srnValue) {
      setSrnError("SRN is required");
      setIsSrnValid(false);
      return;
    }

    // Validate SRN format
    const srnPattern = /^PES\d{1}[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
    if (!srnPattern.test(srnValue)) {
      setSrnError("Invalid SRN format. Expected: PES2UG*******");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, srn }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      router.push('/protected');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="flex min-h-svh items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Image
            src="/icon.png"
            alt="Logo"
            width={64}
            height={64}
            className="mx-auto mb-2"
          />
          <h1 className="text-3xl font-bold text-center text-primary">
            Complete Your Profile
          </h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Profile Information</CardTitle>
              <CardDescription>
                Please provide your details to complete registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
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
                  
                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading || !isSrnValid}>
                    {isLoading ? "Creating profile..." : "Complete Registration"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
