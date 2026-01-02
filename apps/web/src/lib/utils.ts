import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to check if an error is a TanStack Router redirect
 * Redirects are thrown objects with at least a 'to' property
 */
export function isRedirectError(error: unknown): boolean {
  if (error === null || typeof error !== "object" || !("to" in error)) {
    return false;
  }

  const { to } = error as { to?: unknown };
  return typeof to === "string" || (to !== null && typeof to === "object");
}
