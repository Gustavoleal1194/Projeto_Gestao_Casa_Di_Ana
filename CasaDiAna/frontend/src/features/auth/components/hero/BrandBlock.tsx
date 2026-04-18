function CoffeeIcon() {
  return (
    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 4c0 0 .4-1.5 1.5-1.5s1.5 1.5 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 8.5h12v8.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 014 17V8.5z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 11h2a1.5 1.5 0 010 3h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function BrandBlock() {
  return (
    <>
      {/* Bloco superior — logo + título + subtítulo agrupados no topo,
          liberando o centro do painel para o globo respirar sem colisão. */}
      <div className="relative z-10 flex items-center gap-4 max-w-sm">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-white leading-tight tracking-tight"
            style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Casa di Ana
          </h1>
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#9CA3AF', fontFamily: 'DM Sans, system-ui, sans-serif' }}
          >
            Sistema de Gestão Operacional
          </p>
        </div>
      </div>

      {/* Bloco inferior — features + rodapé, abaixo do globo */}
      <div className="relative z-10 space-y-5 max-w-sm">
        <div className="space-y-2.5">
          {[
            'Controle completo de estoque e ingredientes',
            'Produção diária com rastreamento de perdas',
            'Relatórios financeiros e de desempenho',
          ].map(feat => (
            <div key={feat} className="flex items-center gap-3">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: '#D4960C' }}
                aria-hidden="true"
              />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{feat}</p>
            </div>
          ))}
        </div>

        <p className="text-xs pt-4 border-t border-white/5" style={{ color: '#4B5563' }}>
          © {new Date().getFullYear()} Casa di Ana — Todos os direitos reservados
        </p>
      </div>
    </>
  )
}
