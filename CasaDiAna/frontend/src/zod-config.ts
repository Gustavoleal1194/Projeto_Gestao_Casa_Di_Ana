import { config } from 'zod'

// Zod v4 testa suporte a eval (new Function) na primeira instância de z.object().
// O nginx proíbe eval via CSP (script-src sem 'unsafe-eval').
// jitless:true desliga o caminho JIT antes que o teste aconteça.
config({ jitless: true })
