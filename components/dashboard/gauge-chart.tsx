"use client"

interface GaugeChartProps {
  value: number
  color: string
  size?: number
}

export function GaugeChart({ value, color, size = 52 }: GaugeChartProps) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 4 }}>
      <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0.5">
        <span className="text-[10px] font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  )
}