import JoinCTA from '../components/JoinCTA'
import EventsCalendar from '../components/EventsCalendar'

export default function Events() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 text-left sm:px-8 sm:pt-20">
        <h1 className="animate-rise text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          Events
        </h1>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 text-left sm:px-8 sm:py-16">
        <EventsCalendar />
      </section>

      <JoinCTA
        mode="partner"
        title="Interested in partnering with us?"
        description="Reach out about speaking, co-hosting events, or other collaborations."
      />
    </div>
  )
}
