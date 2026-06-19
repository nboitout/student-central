'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  children: React.ReactNode
}

export default function AdminNavLink({ href, children }: Props) {
  const pathname = usePathname()
  const isActive =
    href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href)

  return (
    <Link href={href} className={`adm-nav-link${isActive ? ' active' : ''}`}>
      {children}
    </Link>
  )
}
