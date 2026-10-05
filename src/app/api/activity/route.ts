import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { listActivity } from "@/services/activityService";

export async function GET(request: Request) {
  const { user, error } = await authorizeApi("activity:view");
  if (error) return error;
  const params = new URL(request.url).searchParams;
  const limit = Math.min(Number(params.get("limit")) || 20, 100);
  return NextResponse.json({
    activity: await listActivity(user, { projectId: params.get("project") ?? undefined, limit }),
  });
}
