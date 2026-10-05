import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { listProjectsForUser } from "@/services/projectService";

// Example of a permission-protected API route. Copy this pattern for new endpoints.
export async function GET() {
  const { user, error } = await authorizeApi("project:view");
  if (error) return error;
  return NextResponse.json({ projects: await listProjectsForUser(user) });
}
