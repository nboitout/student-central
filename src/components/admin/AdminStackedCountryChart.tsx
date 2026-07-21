'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface StackedTimePoint {
  date: string
  [country: string]: number | string
}

interface Props {
  data: StackedTimePoint[]
  countries: string[]
  /** X-axis label mode: 'date' strips the year from YYYY-MM-DD; 'raw' shows the value as-is. */
  labelMode?: 'date' | 'raw'
  /** X-axis tick interval (recharts). Default shows first & last only. */
  interval?: number | 'preserveStartEnd'
  /** Optional fixed colour per country, so the same country keeps one colour
   *  across charts. Falls back to the index palette when a country is missing. */
  colorMap?: Record<string, string>
}

// High-contrast categorical palette — distinct hue AND lightness between
// neighbours for readability (chosen for low-vision / older viewers).
// Last colour is a neutral grey reserved for the 'Other' bucket.
const PALETTE = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
  '#469990', '#f032e6', '#9a6324', '#800000', '#808000', '#9a9a9a',
]

export default function AdminStackedCountryChart({
  data,
  countries,
  labelMode = 'date',
  interval = 'preserveStartEnd',
  colorMap,
}: Props) {
  const tickFormatter = labelMode === 'raw' ? (v: string) => v : (v: string) => v.slice(5)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,26,56,.10)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(13,26,56,.55)', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={tickFormatter}
          interval={interval}
        />
        <YAxis
          tick={{ fill: 'rgba(13,26,56,.55)', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0d1a38',
            border: '1px solid rgba(0,72,216,.35)',
            borderRadius: 3,
            color: '#ffffff',
            fontSize: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          labelStyle={{ color: 'rgba(255,255,255,.6)', marginBottom: 6, fontSize: 11 }}
          cursor={{ fill: 'rgba(0,72,216,.05)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(13,26,56,.62)', fontFamily: 'Inter, system-ui, sans-serif', paddingTop: 12 }}
        />
        {countries.map((country, i) => (
          <Bar
            key={country}
            dataKey={country}
            stackId="a"
            fill={colorMap?.[country] ?? PALETTE[i % PALETTE.length]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
