import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
  },
});

// Export commonly used hooks and methods
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
