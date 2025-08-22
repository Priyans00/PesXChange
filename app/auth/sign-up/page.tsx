import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Image
            src="/icon.png"
            alt="PESU Logo"
            width={64}
            height={64}
            className="mx-auto mb-2"
          />
          <h1 className="text-3xl font-bold text-center text-primary">
            PesXChange
          </h1>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Access Restricted</CardTitle>
              <CardDescription>
                PesXChange is exclusively for PESU students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This marketplace is designed specifically for PESU (PES University) students to buy, sell, and exchange items within the campus community.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you&apos;re a PESU student, you already have access! Simply use your existing PESU Academy credentials to sign in.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link href="/auth/login" className="block">
                  <Button className="w-full">
                    Sign in with PESU Account
                  </Button>
                </Link>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Need help with your PESU account?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contact PESU IT Support or Administration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
