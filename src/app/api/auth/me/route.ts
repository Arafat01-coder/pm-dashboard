import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";

export async function GET() {
  const { user, error } = await authorizeApi();
  if (error) return error;
  return NextResponse.json({ user });
}
