import { useRef, useState } from 'react'
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

function formatLong(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function EventItem({ event }) {
  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 border-t border-line py-4">
      <span className="text-sm text-muted">{event.time}</span>
      <div className="min-w-0">
        <p className="text-base leading-snug text-ink">{event.title}</p>
        {event.location ? (
          <p className="mt-1 text-sm leading-relaxed text-muted">{event.location}</p>
        ) : null}
      </div>
    </li>
  )
}

function Agenda({ selected }) {
  const dayEvents = getEventsForDate(selected)

  return (
    <div aria-live="polite">
      <h3 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
        {formatLong(selected)}
      </h3>

      {dayEvents.length > 0 ? (
        <ul className="mt-6">
          {dayEvents.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-base text-muted">Nothing scheduled this day.</p>
      )}
    </div>
  )
}

export default function EventsCalendar() {
  const today = startOfDay(new Date())
  const todayKey = toDateKey(today)
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(todayKey)
  const [direction, setDirection] = useState(0)
  const agendaRef = useRef(null)

  const year = cursor.getFullYear()
  const monthIndex = cursor.getMonth()
  const cells = buildMonthCells(year, monthIndex)

  const monthLabel = cursor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function goToMonth(next, nextSelected) {
    setDirection(next > cursor ? 1 : next < cursor ? -1 : 0)
    setCursor(next)
    setSelected(nextSelected ?? toDateKey(next))
  }

  // On narrow screens the agenda sits under the grid, so bring it into view.
  function selectDay(key) {
    setSelected(key)
    const agenda = agendaRef.current
    if (!agenda || window.innerWidth >= 1024) return
    if (agenda.getBoundingClientRect().top < window.innerHeight - 96) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    agenda.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  function shiftMonth(delta) {
    const next = new Date(year, monthIndex + delta, 1)
    const isCurrentMonth =
      next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
    goToMonth(next, isCurrentMonth ? todayKey : undefined)
  }

  return (
    <div className="animate-rise-delay grid gap-12 lg:grid-cols-12 lg:gap-x-8">
      <div className="min-w-0 lg:col-span-7">
        <div className="flex items-center justify-between gap-4">
          <h2
            key={`${year}-${monthIndex}-label`}
            className="cal-month font-display text-2xl tracking-tight text-ink sm:text-3xl"
            style={{ '--cal-shift': `${direction * 10}px` }}
          >
            {monthLabel}
          </h2>
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
              onClick={() => goToMonth(new Date(today.getFullYear(), today.getMonth(), 1), todayKey)}
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

        <div
          key={`${year}-${monthIndex}`}
          className="cal-month mt-8 grid grid-cols-7 border-t border-l border-line"
          style={{ '--cal-shift': `${direction * 14}px` }}
        >
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-b border-r border-line px-2 py-3 text-left text-xs font-medium tracking-wide text-muted uppercase"
            >
              {day}
            </div>
          ))}

          {cells.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-14 border-b border-r border-line sm:min-h-[5rem]"
                />
              )
            }

            const key = toDateKey(date)
            const isToday = key === todayKey
            const isSelected = key === selected
            const dayEvents = getEventsForDate(key)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(key)}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                className={[
                  'flex min-h-14 w-full flex-col items-start border-b border-r border-line px-2 pt-1.5 text-left transition-colors sm:min-h-[5rem]',
                  isSelected ? 'bg-surface' : 'bg-paper hover:bg-surface',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-lg',
                    isSelected
                      ? 'bg-crimson font-medium text-white'
                      : isToday
                        ? 'font-medium text-crimson ring-1 ring-crimson ring-inset'
                        : 'text-ink',
                  ].join(' ')}
                >
                  {date.getDate()}
                </span>
                {hasEvents ? (
                  <span className="mt-3 ml-3 h-1.5 w-1.5 rounded-full bg-crimson" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div
        ref={agendaRef}
        className="min-w-0 scroll-mt-20 border-t border-line pt-10 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
      >
        <Agenda selected={selected} />
      </div>
    </div>
  )
}
