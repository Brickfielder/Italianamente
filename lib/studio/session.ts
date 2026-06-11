import { auth, isStudioConfigured } from "../../auth";

export async function requireStudioUser() {
  if (!isStudioConfigured()) {
    throw new Error("Studio is not configured.");
  }

  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Not authenticated.");
  }

  return {
    id: (session.user as { id?: string }).id,
    email: session.user.email,
  };
}

