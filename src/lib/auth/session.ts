import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export interface CurrentUserSession {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
  avatarUrl: string | null;
}

export class AuthError extends Error {
  status: 401 | 403 | 503;

  constructor(message: string, status: 401 | 403 | 503) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Returns the signed-in user's profile. A valid login without a profile has no access. */
export async function getCurrentUser(): Promise<CurrentUserSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  let profile: CurrentUserSession | null;
  try {
    profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true, fullName: true, avatarUrl: true },
    });
  } catch {
    throw new AuthError("Account service is unavailable", 503);
  }

  if (!profile) throw new AuthError("Admin access required", 403);
  return profile;
}
