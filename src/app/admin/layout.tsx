import './admin.css'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, isAdminEmail } from '@/auth'
import AdminNavLink from '@/components/admin/AdminNavLink'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Not signed in → send to the NextAuth login, returning here afterwards.
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  // Signed in but not on the admin allowlist → show a minimal denial panel.
  if (!isAdminEmail(session.user.email)) {
    return (
      <div className="adm-root">
        <div className="adm-login-wrap">
          <div className="adm-login-card">
            <h1 className="adm-login-title">Student Central — Admin</h1>
            <p className="adm-login-sub">Not authorized</p>
            <p style={{ color: 'var(--adm-i50)', fontSize: '.85rem', lineHeight: 1.6, marginTop: 16 }}>
              {session.user.email} does not have admin access. Ask an administrator
              to add your address to <code>ADMIN_EMAILS</code>.
            </p>
            <div style={{ marginTop: 20 }}>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="adm-root">
      <nav className="adm-nav">
        <div className="adm-nav-left">
          <span className="adm-nav-brand">Student Central — Admin</span>
          <div className="adm-nav-links">
            <AdminNavLink href="/admin">Overview</AdminNavLink>
            <AdminNavLink href="/admin/leads">Leads</AdminNavLink>
          </div>
        </div>
        <div className="adm-nav-right">
          <Link href="/" className="adm-nav-site-link">&lt;- studentcentral.ai</Link>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  )
}
