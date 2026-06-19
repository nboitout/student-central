'use client'

import { useRouter } from 'next/navigation'

interface Props {
  days: string[]
  selected: string
  today: string
}

export default function DaySelect({ days, selected, today }: Props) {
  const router = useRouter()
  return (
    <select
      value={selected}
      onChange={(e) => router.push(`/admin?day=${e.target.value}`, { scroll: false })}
      style={{
        background: 'white',
        border: '1px solid var(--adm-i08)',
        borderRadius: 3,
        color: 'var(--adm-ink)',
        fontSize: '.8rem',
        fontFamily: 'DM Sans, sans-serif',
        padding: '4px 8px',
        cursor: 'pointer',
      }}
    >
      {days.map((d) => (
        <option key={d} value={d}>
          {d === today ? `${d} (today)` : d}
        </option>
      ))}
    </select>
  )
}
