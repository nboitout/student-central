// Personal / consumer email providers. A professor or trainer must sign up with
// a professional (institutional) address to unlock the faculty section, so these
// are rejected for that role — and flagged as "personal" in the leads inspector.
export const CONSUMER_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'outlook.fr', 'hotmail.com', 'hotmail.fr',
  'live.com', 'live.fr', 'msn.com', 'yahoo.com', 'yahoo.fr', 'ymail.com', 'icloud.com',
  'me.com', 'mac.com', 'proton.me', 'protonmail.com', 'aol.com', 'gmx.com', 'gmx.fr',
  'free.fr', 'orange.fr', 'wanadoo.fr', 'sfr.fr', 'laposte.net', 'yandex.com', 'mail.com',
])

export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at < 0 ? '' : email.slice(at + 1).trim().toLowerCase()
}

/** True when the email has no domain or uses a known personal provider. */
export function isConsumerEmail(email: string): boolean {
  const d = emailDomain(email)
  return !d || CONSUMER_DOMAINS.has(d)
}
