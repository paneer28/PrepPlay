"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isTestsPassword,
  safeTestsRedirect,
  TESTS_ACCESS_COOKIE,
  TESTS_ACCESS_MAX_AGE,
  testsAccessToken
} from "@/lib/tests-access";

export type UnlockState = { error: string | null };

export async function unlockTestsAction(_previous: UnlockState, formData: FormData): Promise<UnlockState> {
  const password = String(formData.get("password") ?? "");

  if (!isTestsPassword(password)) {
    return { error: "That password isn't right. Try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(TESTS_ACCESS_COOKIE, await testsAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TESTS_ACCESS_MAX_AGE
  });

  redirect(safeTestsRedirect(String(formData.get("next") ?? "")));
}
