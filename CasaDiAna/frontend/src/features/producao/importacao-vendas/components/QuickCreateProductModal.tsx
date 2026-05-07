import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CampoTexto } from '@/components/form/CampoTexto'
import { Spinner } from '@/components/form/Spinner'
import { produtosService } from '@/features/producao/produtos/services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import type { CategoriaProduto, Produto } from '@/types/producao'
import { ConfirmacaoCriacaoRapidaModal, type DadosConfirmacaoCriacaoRapida } from './ConfirmacaoCriacaoRapidaModal'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(100, 'Máximo 100 caracteres.'),
  precoVenda: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number()
      .positive('Deve ser maior que zero')
  ),
  categoriaProdutoId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  nomeInicial: string
  precoInicial?: number
  onSalvo: (produto: Produto) => void
  onFechar: () => void
}

export function QuickCreateProductModal({ nomeInicial, precoInicial, onSalvo, onFechar }: Props) {
  const [salvando, setSalvando] = useState(false)
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [confirma, setConfirma] = useState<DadosConfirmacaoCriacaoRapida | null>(null)
  const [produtoCriado, setProdutoCriado] = useState<Produto | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: nomeInicial,
      precoVenda: precoInicial != null ? precoInicial : undefined,
      categoriaProdutoId: '',
    },
  })

  useEffect(() => {
    categoriasProdutoService.listar().then(setCategorias).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !salvando) onFechar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [salvando, onFechar])

  const onSubmit = async (values: FormValues) => {
    setSalvando(true)
    setErroApi(null)
    try {
      const produto = await produtosService.criar({
        nome: values.nome,
        precoVenda: values.precoVenda as number,
        categoriaProdutoId: values.categoriaProdutoId || null,
      })
      setProdutoCriado(produto)
      setConfirma({ produtoNome: produto.nome })
    } catch {
      setErroApi('Erro ao criar produto. Verifique os dados e tente novamente.')
      setSalvando(false)
    }
  }

  return (
    <>
      {confirma && produtoCriado && (
        <ConfirmacaoCriacaoRapidaModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); onSalvo(produtoCriado) }}
        />
      )}
      <div
        className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-criar-produto-titulo"
      onClick={e => { if (e.target === e.currentTarget && !salvando) onFechar() }}
    >
      <div className="modal-card max-w-md">
        <div className="modal-header">
          <h2
            id="modal-criar-produto-titulo"
            className="text-[15px] font-semibold"
            style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Cadastrar Produto Rápido
          </h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="p-1.5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 disabled:opacity-40"
            aria-label="Fechar"
            style={{ color: 'var(--ada-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--ada-bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div className="px-6 py-5 space-y-4">
            {erroApi && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: 'var(--ada-error-bg)', border: '1px solid var(--ada-error-border)', color: '#DC2626' }}
              >
                {erroApi}
              </div>
            )}

            <CampoTexto
              label="Nome do Produto"
              obrigatorio
              autoFocus
              {...register('nome')}
              erro={errors.nome?.message}
            />

            <CampoTexto
              label="Preço de Venda"
              obrigatorio
              placeholder="0,00"
              sufixo="R$"
              {...register('precoVenda')}
              erro={errors.precoVenda?.message}
            />

            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--ada-body)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
              >
                Categoria
              </label>
              <select
                {...register('categoriaProdutoId')}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#C4870A]/25 focus-visible:border-[#C4870A]"
                style={{
                  background: 'var(--ada-surface)',
                  borderColor: 'var(--ada-border)',
                  color: 'var(--ada-heading)',
                  boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.04))',
                }}
              >
                <option value="">Sem categoria</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="btn-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary disabled:opacity-60"
            >
              {salvando && <Spinner />}
              {salvando ? 'Criando…' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
