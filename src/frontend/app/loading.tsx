export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header>
        <div className="h-3 w-24 rounded-full mb-3" style={{ background: 'var(--grey-card)' }} />
        <div className="h-9 w-3/4 max-w-xl rounded-xl mb-3" style={{ background: 'var(--grey-card)' }} />
        <div className="h-4 w-1/2 max-w-md rounded-xl" style={{ background: 'var(--grey-card)' }} />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6" style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}>
            <div className="w-11 h-11 rounded-xl mb-4" style={{ background: 'var(--grey-card)' }} />
            <div className="h-9 w-20 rounded-lg mb-2" style={{ background: 'var(--grey-card)' }} />
            <div className="h-3 w-24 rounded-full" style={{ background: 'var(--grey-card)' }} />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--grey-card)' }}>
            <div className="h-4 w-32 rounded-lg" style={{ background: 'var(--grey-card)' }} />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl" style={{ background: 'var(--grey-card)' }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}>
          <div className="h-4 w-28 rounded-lg mb-4" style={{ background: 'var(--grey-card)' }} />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--grey-card)' }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
