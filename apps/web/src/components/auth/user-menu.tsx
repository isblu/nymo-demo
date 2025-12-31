import { Link } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out successfully");
      // Force a full page reload to clear all client-side state
      window.location.href = "/login";
    } catch {
      toast.error("Failed to sign out");
    }
  }

  if (isPending) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-gray-700" />;
  }

  if (!session?.user) {
    return (
      <Button
        asChild
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/25 shadow-lg hover:from-indigo-600 hover:to-purple-700"
        size="sm"
      >
        <Link to="/login">
          <LogIn className="mr-2 h-4 w-4" />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-700 bg-gradient-to-br from-indigo-500 to-purple-600 p-0 text-white shadow-indigo-500/25 shadow-lg transition-all hover:border-indigo-500 hover:shadow-indigo-500/40"
          variant="ghost"
        >
          {session.user.image ? (
            <img
              alt={session.user.name ?? "User avatar"}
              className="h-full w-full rounded-full object-cover"
              height={36}
              src={session.user.image}
              width={36}
            />
          ) : (
            <span className="font-semibold text-sm">
              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-gray-800 bg-gray-900"
      >
        <DropdownMenuLabel className="text-gray-300">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm text-white">
              {session.user.name}
            </p>
            <p className="truncate text-gray-500 text-xs">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem
          className="cursor-pointer text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
