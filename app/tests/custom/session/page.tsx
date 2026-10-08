import type { Metadata } from "next";
import { CustomPracticeSessionLoader } from "@/components/PracticeTestLoader";

export const metadata: Metadata = {
  title: "Custom Practice Session | PrepPlay",
  robots: { index: false }
};

export default function CustomPracticeSessionPage() {
  return <CustomPracticeSessionLoader />;
}
