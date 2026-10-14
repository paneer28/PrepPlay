import { cookies } from "next/headers";
import { hasTestsAccess, TESTS_ACCESS_COOKIE } from "@/lib/tests-access";

// Whether this request carries a valid access code for the real DECA exams.
// Server components, routes and actions only.
export async function viewerHasTestsAccess() {
  return hasTestsAccess((await cookies()).get(TESTS_ACCESS_COOKIE)?.value);
}
