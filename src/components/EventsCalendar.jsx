import { useRef, useState } from 'react'
import { events, getEventsForDate, getEventsInMonth, toDateKey } from '../data/events'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Always six weeks, so the grid keeps one height from month to month. */
function buildMonthCells(year, monthIndex) {
  const start = new Date(year, monthIndex, 1 - new Date(year, monthIndex, 1).getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return { date, inMonth: date.getMonth() === monthIndex }
  })
}

function formatLong(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatShort(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function EventItem({ event, showDate }) {
  // The day view already shows the time in the left column.
  const meta = showDate
    ? [event.time, event.location].filter(Boolean).join(' · ')
    : event.location
  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 border-t border-line py-4">
      <span className="text-sm text-muted">{showDate ? formatShort(event.date) : event.time}</span>
      <div className="min-w-0">
        <p className="text-base leading-snug text-ink">{event.title}</p>
        {meta ? <p className="mt-1 text-sm leading-relaxed text-muted">{meta}</p> : null}
      </div>
    </li>
  )
}

function Agenda({ selected, monthLabel, monthEvents, todayKey }) {
  const dayEvents = getEventsForDate(selected)
  const otherEvents = monthEvents.filter((event) => event.date !== selected)
  // Only shown when the viewed month is empty, so look past it.
  const monthKey = selected.slice(0, 7)
  const nextEvent = events
    .filter((event) => event.date >= todayKey && event.date.slice(0, 7) > monthKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

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

      <div className="mt-10">
        <h4 className="text-sm text-muted">
          {otherEvents.length > 0 ? `Also in ${monthLabel}` : `${monthLabel} at a glance`}
        </h4>
        {otherEvents.length > 0 ? (
          <ul className="mt-2">
            {otherEvents.map((event) => (
              <EventItem key={event.id} event={event} showDate />
            ))}
          </ul>
        ) : (
          <p className="mt-2 max-w-sm text-base leading-relaxed text-ink-soft">
            {monthEvents.length > 0
              ? 'That’s everything on the calendar this month.'
              : nextEvent
                ? `No events this month. Next up: ${nextEvent.title}, ${formatShort(nextEvent.date)}.`
                : 'No events posted yet. New dates are announced on Discord first.'}
          </p>
        )}
      </div>
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
  const monthEvents = getEventsInMonth(year, monthIndex).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long' })

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
          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
            {monthName} <span className="text-muted">{year}</span>
          </h2>
          <div className="-mr-3 flex items-center">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="cal-control inline-flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
              aria-label="Previous month"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goToMonth(new Date(today.getFullYear(), today.getMonth(), 1), todayKey)}
              className="cal-control h-11 px-2 text-sm text-muted transition-colors hover:text-ink"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="cal-control inline-flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
              aria-label="Next month"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day} className="w-9 pb-3 text-center text-xs font-medium tracking-wide text-muted uppercase">
              {day}
            </span>
          ))}
        </div>

        <div
          key={`${year}-${monthIndex}`}
          className="cal-month grid grid-cols-7 border-b border-line"
          style={{ '--cal-shift': `${direction * 12}px` }}
        >
          {cells.map(({ date, inMonth }) => {
            const key = toDateKey(date)
            const dayEvents = inMonth ? getEventsForDate(key) : []
            const hasEvents = dayEvents.length > 0
            const isToday = key === todayKey
            const isSelected = inMonth && key === selected

            if (!inMonth) {
              return (
                <div key={key} className="cal-row border-t border-line pt-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center font-display text-lg text-muted">
                    {date.getDate()}
                  </span>
                </div>
              )
            }

            const label = [
              formatLong(key),
              isToday ? 'today' : null,
              hasEvents ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : null,
            ]
              .filter(Boolean)
              .join(', ')

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(key)}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={label}
                className="cal-row group flex flex-col items-start border-t border-line pt-2 text-left"
              >
                <span
                  className={[
                    'inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-lg transition-colors',
                    isSelected
                      ? 'bg-crimson text-white'
                      : isToday
                        ? 'text-crimson ring-1 ring-crimson ring-inset group-hover:bg-surface-muted'
                        : 'text-ink group-hover:bg-surface-muted',
                  ].join(' ')}
                >
                  {date.getDate()}
                </span>
                {hasEvents ? (
                  <span className="mt-1 ml-[0.9rem] h-1.5 w-1.5 rounded-full bg-crimson" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div
        ref={agendaRef}
        className="min-w-0 scroll-mt-20 lg:col-span-5 lg:border-l lg:border-line lg:pl-8"
      >
        <Agenda
          selected={selected}
          monthLabel={monthName}
          monthEvents={monthEvents}
          todayKey={todayKey}
        />
      </div>
    </div>
  )
}
