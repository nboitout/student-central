'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts'

export interface BarDataPoint {
  name: string
  value: number
}

interface Props {
  data: BarDataPoint[]
  color?: string
  layout?: 'vertical' | 'horizontal'
  yAxisWidth?: number
  // Show the value as an always-visible label on each bar (incl. zero/thin bars
  // that are hard or impossible to hover for a tooltip).
  showValues?: boolean
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TruncatedTick({ x, y, payload, maxChars }: any) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="rgba(26,26,24,.65)" fontSize={11} fontFamily="DM Sans, sans-serif">
      {truncate(String(payload.value), maxChars)}
    </text>
  )
}

export default function AdminBarChart({
  data,
  color = '#4a6b5a',
  layout = 'horizontal',
  yAxisWidth = 160,
  showValues = false,
}: Props) {
  const valueLabelStyle = {
    fill: 'rgba(26,26,24,.78)',
    fontSize: 11,
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
  }
  if (layout === 'vertical') {
    const maxChars = Math.floor((yAxisWidth - 8) / 6.5)
    return (
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36 + 40)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.12)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'rgba(26,26,24,.58)', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={<TruncatedTick maxChars={maxChars} />}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a18',
              border: '1px solid rgba(160,124,58,.3)',
              borderRadius: 3,
              color: '#f5f0e8',
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
            }}
            cursor={{ fill: 'rgba(26,26,24,.03)' }}
          />
          <Bar dataKey="value" name="Count" radius={[0, 3, 3, 0]}>
            {showValues && (
              <LabelList dataKey="value" position="right" style={valueLabelStyle} />
            )}
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i % 2 === 0 ? color : '#c9a35e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,24,.12)" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(26,26,24,.58)', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(26,26,24,.58)', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a18',
            border: '1px solid rgba(160,124,58,.3)',
            borderRadius: 3,
            color: '#f5f0e8',
            fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
          }}
          cursor={{ fill: 'rgba(26,26,24,.03)' }}
        />
        <Bar dataKey="value" name="Count" radius={[3, 3, 0, 0]}>
          {showValues && (
            <LabelList dataKey="value" position="top" style={valueLabelStyle} />
          )}
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i % 2 === 0 ? color : '#c9a35e'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
