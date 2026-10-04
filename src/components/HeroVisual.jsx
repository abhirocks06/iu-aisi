/** Editorial hero art — Dorian Gray face on an edge-faded grid. */
export default function HeroVisual({ className = '' }) {
  return (
    <div
      className={`relative aspect-[5/4] w-full overflow-hidden rounded-sm bg-paper select-none ${className}`}
      aria-hidden="true"
    >
      <div className="bg-grid-fade pointer-events-none absolute inset-0" />

      <img
        src="/hero-interpretability.png"
        alt=""
        width={1200}
        height={960}
        className="pointer-events-none relative z-10 h-full w-full object-cover object-center select-none"
        draggable={false}
      />
    </div>
  )
}
