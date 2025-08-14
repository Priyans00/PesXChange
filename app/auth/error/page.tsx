import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  const error = params?.error || "An unspecified error occurred";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Possible Solutions:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Check if the confirmation link has expired</li>
                <li>• Make sure you clicked the correct link from your email</li>
                <li>• Try requesting a new confirmation email</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/auth/sign-up">
                <Button className="w-full">Try Signing Up Again</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Already have an account? Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
