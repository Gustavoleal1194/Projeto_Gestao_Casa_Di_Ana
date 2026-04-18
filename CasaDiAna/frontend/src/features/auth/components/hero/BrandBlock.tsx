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
      {/* Logo */}
      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: '#D4960C' }}
        >
          <CoffeeIcon />
        </div>
      </div>

      {/* Texto central */}
      <div className="relative z-10 space-y-6">
        <div>
          <h1
            className="text-4xl font-bold text-white leading-tight tracking-tight"
            style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Casa di Ana
          </h1>
          <p
            className="mt-3 text-base leading-relaxed"
            style={{ color: '#6B7280', fontFamily: 'DM Sans, system-ui, sans-serif' }}
          >
            Sistema de Gestão Operacional para controle de estoque, produção e vendas.
          </p>
        </div>

        <div className="space-y-3">
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
              <p className="text-sm" style={{ color: '#6B7280' }}>{feat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative z-10">
        <p className="text-xs" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} Casa di Ana — Todos os direitos reservados
        </p>
      </div>
    </>
  )
}
