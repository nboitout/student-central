interface ScorecardProps {
  label: string
  value: string | number
  subtitle?: string
}

export default function Scorecard({ label, value, subtitle }: ScorecardProps) {
  return (
    <div className="adm-scorecard">
      <p className="adm-scorecard-label">{label}</p>
      <p className="adm-scorecard-value">{value}</p>
      {subtitle && <p className="adm-scorecard-sub">{subtitle}</p>}
    </div>
  )
}
