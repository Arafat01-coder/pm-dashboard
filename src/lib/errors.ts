import { NextResponse } from "next/server";

/**
 * Errors the services throw on purpose. API routes turn them into JSON
 * responses with the right status code via handleApiError().
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "Not found") => new AppError(what, 404);
export const forbidden = (message = "You don't have permission to do this") => new AppError(message, 403);
export const badRequest = (message: string, fieldErrors?: Record<string, string>) =>
  new AppError(message, 400, fieldErrors);
export const conflict = (message: string) => new AppError(message, 409);

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, fieldErrors: error.fieldErrors },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Reads a JSON body or throws a 400. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw badRequest("Invalid request body");
}
