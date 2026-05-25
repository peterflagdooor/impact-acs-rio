// Loading skeleton global — Next.js mostra isso INSTANTANEAMENTE enquanto a página
// é renderizada no servidor (incluindo fetches pro backend). Evita "página branca"
// durante o SSR. Cada rota pode sobrescrever criando seu próprio loading.tsx.

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header>
        <div className="h-3 w-24 bg-grey-card rounded mb-3" />
        <div className="h-10 w-3/4 max-w-xl bg-grey-card rounded mb-3" />
        <div className="h-4 w-1/2 max-w-md bg-grey-card rounded" />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-grey-mid border-l-4 border-l-grey-mid p-5 rounded-sm">
            <div className="h-3 w-16 bg-grey-card rounded mb-3" />
            <div className="h-8 w-20 bg-grey-card rounded mb-2" />
            <div className="h-3 w-24 bg-grey-card rounded" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-md p-5 shadow-sm border border-grey-mid border-l-4 border-l-grey-mid">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="h-3 w-40 bg-grey-card rounded mb-2" />
                <div className="h-4 w-24 bg-grey-card rounded" />
              </div>
              <div className="h-6 w-20 bg-grey-card rounded-full" />
            </div>
            <div className="h-3 w-full bg-grey-card rounded mb-2" />
            <div className="h-3 w-2/3 bg-grey-card rounded mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3].map(k => <div key={k} className="h-5 w-20 bg-grey-card rounded-full" />)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
