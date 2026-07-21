'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

export interface PieDataPoint {
  name: string
  value: number
}

interface Props {
  data: PieDataPoint[]
}

// StudentCentral-flavoured qualitative palette: royal-blue / mint / navy family
// with distinct, accessible hues for the remaining slices.
const PALETTE = [
  '#0048d8',
  '#00c664',
  '#3d4a6b',
  '#0091ea',
  '#7a5aa0',
  '#00a3a3',
  '#101f49',
  '#8aa0ff',
  '#f2994a',
  '#b42318',
]

export default function AdminPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#0d1a38',
            border: '1px solid rgba(0,72,216,.35)',
            borderRadius: 3,
            color: '#ffffff',
            fontSize: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(13,26,56,.62)', fontFamily: 'Inter, system-ui, sans-serif' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
