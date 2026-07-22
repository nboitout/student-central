import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isConsumerEmail } from "@/lib/emailDomains";

// Gate the faculty tools: you must be signed in with a professional
// (institutional) email. This mirrors the sign-up rule — professors/trainers
// register with a professional address; personal-email accounts don't get in.
// Works on every sign-in path (registration form, /login, Google) because the
// check is on the email domain, not a stored role.
export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Not signed in → send to login, returning to the faculty entry afterwards.
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/faculty?from=teach")}`);
  }

  const email = session.user.email ?? "";

  // Signed in but on a personal email → show a clear "no faculty access" notice.
  if (isConsumerEmail(email)) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            width: "min(100%, 480px)",
            background: "var(--surface-lowest)",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-ambient)",
            border: "1px solid var(--outline-variant)",
            padding: "34px",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 12 }} aria-hidden="true">🎓</div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              lineHeight: 1.2,
              color: "var(--deep-navy)",
              marginBottom: 12,
            }}
          >
            Faculty access needs a professional email
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "var(--on-surface-variant)",
              marginBottom: 22,
            }}
          >
            You&apos;re signed in as <strong style={{ color: "var(--on-surface)" }}>{email}</strong>, which looks
            like a personal address. The faculty tools are available to professors and trainers using a
            university or organisation email.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/workspace"
              style={{
                background: "var(--primary-gradient)",
                color: "var(--on-primary)",
                fontFamily: "var(--font-label)",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "12px 22px",
                borderRadius: "0.375rem",
                boxShadow: "0 4px 16px rgba(0, 72, 216, 0.30)",
              }}
            >
              Go to your workspace
            </Link>
            <a
              href={`/api/auth/signout?callbackUrl=${encodeURIComponent("/faculty?from=teach")}`}
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "12px 22px",
                borderRadius: "0.375rem",
                border: "1.5px solid var(--outline-variant)",
                color: "var(--on-surface-variant)",
              }}
            >
              Sign in with a professional email
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
