import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { listUsers } from "@/services/userService";

export async function GET() {
  const { error } = await authorizeApi("user:view");
  if (error) return error;
  return NextResponse.json({ users: await listUsers() });
}
