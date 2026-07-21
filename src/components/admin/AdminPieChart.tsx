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

const PALETTE = [
  '#4a6b5a',
  '#c9a35e',
  '#7a9b8a',
  '#a07c3a',
  '#5a8b6a',
  '#e0b97a',
  '#3a5b4a',
  '#b08c4e',
  '#6a7b6a',
  '#d0a96e',
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
            background: '#1a1a18',
            border: '1px solid rgba(160,124,58,.3)',
            borderRadius: 3,
            color: '#f5f0e8',
            fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(26,26,24,.62)', fontFamily: 'DM Sans, sans-serif' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
