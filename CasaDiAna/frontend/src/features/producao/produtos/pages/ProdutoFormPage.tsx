import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'

const selectClass =
  'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useProdutoForm()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    categoriasProdutoService.listar().then(setCategorias).catch(() => {})
    if (!id) return
    produtosService
      .obterPorId(id)
      .then(p => reset(produtoParaForm(p)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar produto.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: ProdutoFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await produtosService.atualizar({ id, ...input })
        setToast({ tipo: 'sucesso', mensagem: 'Produto atualizado com sucesso.' })
      } else {
        await produtosService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Produto criado com sucesso.' })
      }
      setTimeout(() => navigate('/producao/produtos'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar produto.' })
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={() => navigate('/producao/produtos')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {isEdicao ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <CampoTexto
                  label="Nome"
                  obrigatorio
                  placeholder="Nome do produto"
                  erro={errors.nome?.message}
                  {...register('nome')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Preço de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  {...register('precoVenda')}
                />
                {errors.precoVenda && (
                  <p className="mt-1 text-xs text-red-600">{errors.precoVenda.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
                <select className={selectClass} {...register('categoriaProdutoId')}>
                  <option value="">Sem categoria</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Validade (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 7"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  {...register('diasValidade')}
                />
                {errors.diasValidade && (
                  <p className="mt-1 text-xs text-red-600">{errors.diasValidade.message}</p>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  Usado para calcular validade nas etiquetas
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
            <textarea
              rows={3}
              placeholder="Descrição do produto (opcional)"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('descricao')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/producao/produtos')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}
    </div>
  )
}
