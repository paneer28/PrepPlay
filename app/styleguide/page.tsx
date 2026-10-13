import type { Metadata } from "next";
import { Styleguide } from "@/app/styleguide/Styleguide";

export const metadata: Metadata = {
  title: "Styleguide | PrepPlay",
  robots: { index: false, follow: false }
};

export default function StyleguidePage() {
  return <Styleguide />;
}
