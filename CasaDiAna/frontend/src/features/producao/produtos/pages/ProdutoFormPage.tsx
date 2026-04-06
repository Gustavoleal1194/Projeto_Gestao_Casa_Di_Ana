// frontend/src/features/producao/produtos/pages/ProdutoFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Spinner } from '@/components/form/Spinner'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'

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
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-amber-700" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <Link
        to="/producao/produtos"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4870A]/40 rounded"
        style={{ color: 'var(--ada-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#C4870A'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--ada-muted)'}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Produtos
      </Link>

      <h1
        className="text-xl font-bold tracking-tight mb-6"
        style={{ color: 'var(--ada-heading)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {isEdicao ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCard>
          <FormSection titulo="Identificação" />
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
            <CampoTexto
              label="Preço de Venda (R$)"
              obrigatorio
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              erro={errors.precoVenda?.message}
              {...register('precoVenda')}
            />
            <SelectCampo
              label="Categoria"
              placeholderOpcao="Sem categoria"
              opcoes={categorias.map(c => ({ valor: c.id, rotulo: c.nome }))}
              erro={errors.categoriaProdutoId?.message}
              {...register('categoriaProdutoId')}
            />
          </div>

          <FormSection titulo="Descrição" />
          <FormTextarea
            label="Descrição"
            placeholder="Descrição do produto (opcional)"
            {...register('descricao')}
            erro={errors.descricao?.message}
          />

          <FormActions
            salvando={isSubmitting}
            labelSalvar={isEdicao ? 'Salvar Alterações' : 'Criar Produto'}
            onCancelar={() => navigate('/producao/produtos')}
          />
        </FormCard>
      </form>
    </div>
  )
}
