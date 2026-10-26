import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | PrepPlay",
  description: "The rules for using PrepPlay."
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 26, 2026">
      <p>By using PrepPlay you agree to these terms. If you don&apos;t agree, please don&apos;t use the site.</p>

      <section>
        <h2>What PrepPlay is</h2>
        <p>
          PrepPlay is a free tool for practicing DECA roleplays and exams. It is an independent student project and is not
          affiliated with, endorsed by, or sponsored by DECA Inc.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Keep your login details to yourself. You&apos;re responsible for what happens on your account.</li>
          <li>Give a real email address you have access to.</li>
          <li>You must be at least 13 years old to create an account.</li>
        </ul>
      </section>

      <section>
        <h2>Fair use</h2>
        <ul>
          <li>Use PrepPlay for your own practice.</li>
          <li>Don&apos;t copy, scrape, or republish the practice tests or roleplays.</li>
          <li>Don&apos;t try to break, overload, or get around access limits on the site.</li>
        </ul>
        <p>We may suspend accounts that break these rules.</p>
      </section>

      <section>
        <h2>No guarantees</h2>
        <p>
          PrepPlay is provided as-is. We work to keep questions, scoring, and feedback accurate, but we can&apos;t promise they are
          error-free or that the site will always be available, and practice scores don&apos;t predict competition results. To
          the extent the law allows, we aren&apos;t liable for losses from using the site.
        </p>
      </section>

      <section>
        <h2>Your privacy</h2>
        <p>
          How we handle your information is covered in our{" "}
          <Link href="/privacy" className="font-bold text-brand-text hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>We may update these terms. When we do, we&apos;ll change the date at the top, and continuing to use PrepPlay means you accept them.</p>
      </section>
    </LegalPage>
  );
}
