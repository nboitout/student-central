'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  children: React.ReactNode
  className?: string
}

export default function AdminNavLink({ href, children, className }: Props) {
  const pathname = usePathname()
  const isActive =
    href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href)

  return (
    <Link href={href} className={`adm-nav-link${className ? ' ' + className : ''}${isActive ? ' active' : ''}`}>
      {children}
    </Link>
  )
}
