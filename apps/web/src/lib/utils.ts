import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to check if an error is a TanStack Router redirect
 */
export function isRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "to" in error &&
    typeof (error as { to?: unknown }).to === "string"
  );
}
