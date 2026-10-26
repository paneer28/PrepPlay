import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | PrepPlay",
  description: "What PrepPlay collects, why, and how to delete it."
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 26, 2026">
      <p>
        PrepPlay is a free practice tool for DECA competitors. We collect as little as we can, we never sell your information, and
        you can practice roleplays without an account.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details.</strong> Your email address, and a password if you sign up with email. If you sign in with
            Google, we receive your email address and basic profile from Google. We never see your Google password.
          </li>
          <li>
            <strong>Practice history.</strong> The roleplays you generate, the answers you write, their feedback, and your practice
            test attempts and scores, so you can review them later.
          </li>
          <li>
            <strong>Email preference.</strong> Whether you chose to get updates and practice tips by email.
          </li>
          <li>
            <strong>Usage stats.</strong> Anonymous page-view counts through Vercel Analytics, which does not use cookies to track
            you across sites.
          </li>
        </ul>
        <p>Guests who don&apos;t sign in have their practice progress kept only in their own browser.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To sign you in and keep your practice history.</li>
          <li>To avoid giving you the same roleplay scenario over and over.</li>
          <li>To send you updates, only if you opted in. You can opt out at any time.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>
          We don&apos;t sell or rent your information. It is stored with the services that run PrepPlay: Supabase (accounts and
          database), Vercel (hosting and analytics), and Google (if you use Google sign-in). They handle it only to provide those
          services.
        </p>
      </section>

      <section>
        <h2>Cookies and browser storage</h2>
        <p>
          We use cookies only to keep you signed in. Your browser also stores a few settings on your device, such as light or dark
          theme.
        </p>
      </section>

      <section>
        <h2>Students</h2>
        <p>
          PrepPlay is meant for high school and college DECA members. It is not intended for children under 13, and we don&apos;t
          knowingly collect information from them.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          You can delete individual practice results from your account page. To delete your whole account and everything tied to
          it, contact the PrepPlay team and we&apos;ll remove it.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If this policy changes, we&apos;ll update the date at the top of this page.</p>
      </section>
    </LegalPage>
  );
}
