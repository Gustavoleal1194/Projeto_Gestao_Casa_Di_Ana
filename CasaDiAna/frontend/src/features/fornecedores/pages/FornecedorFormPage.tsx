import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useFornecedorForm, fornecedorParaForm, formParaInput } from '../hooks/useFornecedorForm'
import { fornecedoresService } from '../services/fornecedoresService'
import { CampoTexto } from '@/features/estoque/ingredientes/components/CampoTexto'
import { Toast } from '@/features/estoque/ingredientes/components/Toast'
import type { FornecedorFormValues } from '@/types/estoque'

export function FornecedorFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdicao = Boolean(id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useFornecedorForm()
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!id) return
    fornecedoresService
      .obterPorId(id)
      .then(f => reset(fornecedorParaForm(f)))
      .catch(() => setToast({ tipo: 'erro', mensagem: 'Erro ao carregar fornecedor.' }))
      .finally(() => setCarregando(false))
  }, [id, reset])

  const onSubmit = async (values: FornecedorFormValues) => {
    try {
      const input = formParaInput(values)
      if (id) {
        await fornecedoresService.atualizar({ id, ...input })
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor atualizado com sucesso.' })
      } else {
        await fornecedoresService.criar(input)
        setToast({ tipo: 'sucesso', mensagem: 'Fornecedor criado com sucesso.' })
      }
      setTimeout(() => navigate('/fornecedores'), 1200)
    } catch {
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar fornecedor.' })
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
        onClick={() => navigate('/fornecedores')}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Fornecedores
      </button>

      <h1 className="text-2xl font-semibold text-stone-800 mb-6">
        {isEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-6">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Razão Social"
                obrigatorio
                placeholder="Nome jurídico completo"
                erro={errors.razaoSocial?.message}
                {...register('razaoSocial')}
              />
              <CampoTexto
                label="Nome Fantasia"
                placeholder="Nome comercial (opcional)"
                erro={errors.nomeFantasia?.message}
                {...register('nomeFantasia')}
              />
            </div>
            <div className="mt-4 max-w-xs">
              <CampoTexto
                label="CNPJ"
                placeholder="14 dígitos sem pontuação"
                erro={errors.cnpj?.message}
                {...register('cnpj')}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Contato</p>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Telefone"
                placeholder="(11) 99999-9999"
                erro={errors.telefone?.message}
                {...register('telefone')}
              />
              <CampoTexto
                label="E-mail"
                placeholder="contato@empresa.com"
                erro={errors.email?.message}
                {...register('email')}
              />
              <CampoTexto
                label="Nome do Contato"
                placeholder="Responsável pelo atendimento"
                erro={errors.contatoNome?.message}
                {...register('contatoNome')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea
              rows={3}
              placeholder="Informações adicionais..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              {...register('observacoes')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/fornecedores')}
            className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
          </button>
        </div>
      </form>

      {toast && <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />}
    </div>
  )
}
