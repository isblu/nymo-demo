import { useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to sign in");
        return;
      }

      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-gray-800 bg-gray-900/80 backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25 shadow-lg">
          <LogIn className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="font-bold text-2xl text-white tracking-tight">
          Welcome back
        </CardTitle>
        <p className="text-gray-400 text-sm">Sign in to access the demo</p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300" htmlFor="email">
              Email
            </Label>
            <div className="relative">
              <Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-500" />
              <Input
                autoComplete="email"
                className="border-gray-700 bg-gray-800/50 pl-10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                disabled={isLoading}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              <Lock className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-500" />
              <Input
                autoComplete="current-password"
                className="border-gray-700 bg-gray-800/50 pl-10 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                disabled={isLoading}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-6">
          <Button
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white shadow-indigo-500/25 shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
