import { useEffect, useMemo, useState } from 'react'

const COLS = 14
const ROWS = 10

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function buildFrame(seed, focusCol) {
  const rand = mulberry32(seed)
  const cells = []

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const dx = (col - focusCol) / COLS
      const dy = (row - ROWS / 2) / ROWS
      const ridge = Math.exp(-(dx * dx * 16 + dy * dy * 7))
      const noise = rand()
      const value = Math.min(1, noise * 0.4 + ridge * 0.7)
      cells.push(value)
    }
  }

  return cells
}

function cellFill(value) {
  if (value < 0.2) return 'rgba(153,0,0,0.04)'
  if (value < 0.4) return 'rgba(153,0,0,0.12)'
  if (value < 0.6) return 'rgba(153,0,0,0.28)'
  if (value < 0.8) return 'rgba(153,0,0,0.48)'
  return 'rgba(153,0,0,0.72)'
}

/** Light-theme interpretability panel for the hero. */
export default function HeroVisual({ className = '' }) {
  const [seed, setSeed] = useState(3)
  const [focusCol, setFocusCol] = useState(5)
  const cells = useMemo(() => buildFrame(seed, focusCol), [seed, focusCol])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const timer = window.setInterval(() => {
      setSeed((current) => current + 1)
      setFocusCol((current) => {
        const next = current + 1
        return next >= COLS - 2 ? 2 : next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={`relative aspect-[5/4] w-full max-w-lg overflow-hidden rounded-sm ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-grid opacity-70" />

      <svg
        viewBox="0 0 400 320"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-blob" x1="40" y1="20" x2="360" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#990000" />
            <stop offset="0.45" stopColor="#b33a2e" />
            <stop offset="1" stopColor="#5c0a0a" />
          </linearGradient>
          <filter id="hero-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <path
          d="M72 188C48 142 62 78 118 58C168 40 214 68 248 54C292 36 338 62 352 112C366 164 342 214 298 246C254 278 196 286 148 268C104 252 90 224 72 188Z"
          fill="url(#hero-blob)"
          opacity="0.92"
          filter="url(#hero-soft)"
        />
        <path
          d="M96 196C78 160 92 112 134 98C172 86 208 108 236 96C268 82 304 100 314 138C324 176 304 214 268 236C230 258 184 262 146 248C114 236 108 220 96 196Z"
          fill="#7a0000"
          opacity="0.35"
        />
      </svg>

      <div className="absolute top-[14%] right-[10%] w-[42%] overflow-hidden rounded-sm border border-line bg-paper/90 p-2 shadow-sm backdrop-blur-sm">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, 10px)`,
          }}
        >
          {cells.map((value, index) => (
            <div
              key={index}
              style={{
                background: cellFill(value),
                transition: 'background-color 0.7s ease',
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-[12%] left-[8%] w-[36%] overflow-hidden rounded-sm border border-line bg-ink p-2 shadow-sm">
        <div
          className="grid gap-px opacity-90"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(6, 8px)`,
          }}
        >
          {cells.slice(0, COLS * 6).map((value, index) => (
            <div
              key={index}
              style={{
                background:
                  value < 0.35
                    ? 'rgba(255,255,255,0.08)'
                    : value < 0.65
                      ? 'rgba(255,255,255,0.28)'
                      : 'rgba(255,255,255,0.55)',
                transition: 'background-color 0.7s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
