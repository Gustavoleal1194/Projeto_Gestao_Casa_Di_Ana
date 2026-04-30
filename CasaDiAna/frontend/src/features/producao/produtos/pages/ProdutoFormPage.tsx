import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProdutoForm, produtoParaForm, formParaInput } from '../hooks/useProdutoForm'
import { produtosService } from '../services/produtosService'
import { categoriasProdutoService } from '@/features/producao/categorias-produto/services/categoriasProdutoService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { SelectCampo } from '@/features/estoque/ingredientes/components/SelectCampo'
import { FormTextarea } from '@/components/form/FormTextarea'
import { FormSection } from '@/components/form/FormSection'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import { LoadingState } from '@/components/ui/LoadingState'
import type { CategoriaProduto, ProdutoFormValues } from '@/types/producao'
import { ConfirmacaoProdutoModal, type DadosConfirmacaoProduto } from '../components/ConfirmacaoProdutoModal'

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useProdutoForm()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)
  const [confirma, setConfirma] = useState<DadosConfirmacaoProduto | null>(null)

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
      } else {
        await produtosService.criar(input)
      }
      setConfirma({
        produtoNome: values.nome,
        precoVenda: Number(values.precoVenda),
        modo: id ? 'atualizado' : 'criado',
      })
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar produto.' })
    }
  }

  if (carregando) {
    return (
      <div className="ada-page">
        <LoadingState mensagem="Carregando produto…" />
      </div>
    )
  }

  return (
    <div className="ada-page max-w-2xl">
      {confirma && (
        <ConfirmacaoProdutoModal
          aberto
          dados={confirma}
          onFechar={() => { setConfirma(null); navigate('/producao/produtos') }}
          onVerProdutos={() => { setConfirma(null); navigate('/producao/produtos') }}
        />
      )}
      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onFechar={() => setToast(null)} />}

      <PageHeader
        titulo={isEdicao ? 'Editar Produto' : 'Novo Produto'}
        breadcrumb={['Produção', 'Produtos']}
      />

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
