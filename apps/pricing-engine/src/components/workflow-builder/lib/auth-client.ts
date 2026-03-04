/**
 * Auth client stub - bridges to Clerk instead of Better Auth
 */

// Stub authClient - not used in our app (we use Clerk)
export const authClient = {
  signIn: { social: async () => {} },
  signOut: async () => {},
  useSession: () => ({ data: null, isPending: false }),
};

// Stub useSession hook - returns a minimal session-like object
export function useSession() {
  return {
    data: {
      user: {
        id: "stub",
        name: "User",
        email: "",
        image: null,
      },
      session: { id: "stub" },
    },
    isPending: false,
  };
}
