import { NextResponse } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AuthError, getCurrentUser, type CurrentUserSession } from "./session";

export { AuthError };

export async function requireAdmin(): Promise<CurrentUserSession> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Authentication required", 401);
  if (user.role !== "SUPER_ADMIN") throw new AuthError("Admin access required", 403);
  return user;
}

export async function requireAdminPage(): Promise<CurrentUserSession> {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) redirect("/login");
    if (error instanceof AuthError && error.status === 403) notFound();
    throw error;
  }
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (code === "P2002") return NextResponse.json({ error: "This already exists" }, { status: 409 });
  console.error("[Admin API]", error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
