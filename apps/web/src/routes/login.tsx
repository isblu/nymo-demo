import { createFileRoute, redirect } from "@tanstack/react-router";
import logoImage from "@/assets/favicon.png";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    try {
      const session = await getSession();
      if (session.data?.user) {
        throw redirect({ to: "/" });
      }
    } catch (error) {
      // If it's a redirect, rethrow it
      if (error && typeof error === "object" && "to" in error) {
        throw error;
      }
      // If session check fails (e.g., network error), allow login page to load
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="-left-1/4 -top-1/4 absolute h-1/2 w-1/2 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-3xl" />
        <div className="-bottom-1/4 -right-1/4 absolute h-1/2 w-1/2 rounded-full bg-gradient-to-tl from-indigo-500/20 to-purple-600/20 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 flex items-center gap-3">
        <img
          alt="Nymo Logo"
          className="h-12 w-12 object-contain"
          height={48}
          src={logoImage}
          width={48}
        />
        <span className="font-bold text-2xl text-white tracking-tight">
          Nymo
        </span>
      </div>

      {/* Sign In Form */}
      <div className="relative z-10">
        <SignInForm />
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center text-gray-600 text-sm">
        Internal Use Only
      </p>
    </div>
  );
}
