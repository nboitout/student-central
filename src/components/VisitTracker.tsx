'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { getSessionId, getSessionUtm } from '@/lib/session'

// Admin pages are operator tooling, not audience traffic — never track them.
function isTracked(pathname: string): boolean {
  return !pathname.startsWith('/admin')
}

export default function VisitTracker() {
  const { lang } = useLanguage()
  const pathname = usePathname()

  // Mutable refs — never trigger re-renders
  const langRef = useRef(lang)
  const prevPage = useRef(pathname)
  const activeMs = useRef(0)
  const lastVisible = useRef<number | null>(null)

  useEffect(() => { langRef.current = lang }, [lang])

  // Set up visibility + pagehide handlers once on mount
  useEffect(() => {
    lastVisible.current = document.visibilityState === 'visible' ? Date.now() : null

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        // Returning to the page: start a fresh measurement. (No new page_visit —
        // they didn't reload, so this continues the same view.)
        lastVisible.current = Date.now()
      } else {
        // Going to the background. This is the LAST reliable moment to report
        // dwell on mobile, where `pagehide` frequently never fires (the OS
        // suspends/kills the tab on app-switch and the keepalive beacon is
        // dropped). Flush the accumulated active time now; sendLeave resets the
        // timer, so if they come back we measure the new chunk afresh.
        sendLeave(prevPage.current)
      }
    }

    function sendLeave(page: string) {
      if (!isTracked(page)) return
      if (lastVisible.current !== null) {
        activeMs.current += Date.now() - lastVisible.current
        lastVisible.current = null
      }
      const seconds = Math.round(activeMs.current / 1000)
      activeMs.current = 0
      if (seconds < 1) return
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'page_leave', lang: langRef.current, page, duration_seconds: seconds, sessionId: getSessionId() }),
        keepalive: true,
      }).catch(() => {})
    }

    function onPageHide() { sendLeave(prevPage.current) }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

  // On SPA navigation: flush dwell time for the page being left, reset timer
  useEffect(() => {
    const current = pathname
    const prev = prevPage.current
    if (prev === current) return
    prevPage.current = current

    if (lastVisible.current !== null) {
      activeMs.current += Date.now() - lastVisible.current
      lastVisible.current = null
    }
    const seconds = Math.round(activeMs.current / 1000)
    activeMs.current = 0
    lastVisible.current = document.visibilityState === 'visible' ? Date.now() : null

    if (seconds >= 1 && isTracked(prev)) {
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'page_leave', lang: langRef.current, page: prev, duration_seconds: seconds, sessionId: getSessionId() }),
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname])

  // Fire page_visit on mount and when lang or page changes — skip admin pages.
  // The public homepage and /login ARE tracked: they are the acquisition and
  // conversion steps of the visitor → user funnel.
  useEffect(() => {
    if (!isTracked(pathname)) return
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, page: pathname, sessionId: getSessionId(), utm: getSessionUtm() }),
      keepalive: true,
    }).catch(() => {})
  }, [lang, pathname])

  return null
}
