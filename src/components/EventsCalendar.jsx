import { useState } from 'react'
import { getEventsForDate, toDateKey } from '../data/events'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export default function EventsCalendar() {
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(() => toDateKey(today))

  const year = cursor.getFullYear()
  const monthIndex = cursor.getMonth()
  const cells = buildMonthCells(year, monthIndex)
  const selectedEvents = getEventsForDate(selected)

  const monthLabel = cursor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function shiftMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <div className="animate-rise-delay w-full">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelected(toDateKey(today))
            }}
            className="px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-ink"
            aria-label="Next month"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-7 border-t border-l border-line">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-b border-r border-line px-2 py-3 text-center text-xs font-medium tracking-wide text-muted uppercase"
          >
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-16 border-b border-r border-line bg-paper sm:min-h-24"
              />
            )
          }

          const key = toDateKey(date)
          const isToday = key === toDateKey(today)
          const isSelected = key === selected
          const dayEvents = getEventsForDate(key)
          const hasEvents = dayEvents.length > 0

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                'flex min-h-16 flex-col items-start gap-1 border-b border-r border-line px-2 py-2 text-left transition-colors sm:min-h-24',
                isSelected
                  ? 'bg-surface'
                  : hasEvents
                    ? 'bg-crimson/[0.04] hover:bg-surface'
                    : 'bg-paper hover:bg-surface',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-7 w-7 items-center justify-center text-sm',
                  isToday
                    ? 'rounded-full bg-crimson font-medium text-white'
                    : hasEvents
                      ? 'font-medium text-crimson'
                      : 'text-ink',
                ].join(' ')}
              >
                {date.getDate()}
              </span>
              {hasEvents && (
                <span className="mt-auto line-clamp-2 w-full text-left text-[0.65rem] leading-snug text-crimson sm:text-xs">
                  {dayEvents[0].title}
                  {dayEvents.length > 1 ? ` +${dayEvents.length - 1}` : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-sm text-muted">
          {new Date(`${selected}T12:00:00`).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-base text-ink-soft">No events on this day.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-base text-ink-soft">
            {selectedEvents.map((event) => {
              const details = [event.time, event.location].filter(Boolean).join(' · ')
              return (
                <li key={event.id}>
                  • {event.title}
                  {details ? ` - ${details}` : ''}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
