import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormActions } from '@/components/form/FormActions'
import { FormCard } from '@/components/form/FormCard'
import { FormSection } from '@/components/form/FormSection'
import { Toast } from '@/components/ui/Toast'
import { extrairMensagemErro } from '@/lib/erros'
import type { EntradaEdicaoFormValues, EntradaMercadoria, Fornecedor } from '@/types/estoque'
import { entradasService } from '../services/entradasService'
import { entradaEdicaoSchema } from '../schemas/entradaSchemas'
import { itensDaEntrada, montarEdicaoInput, valoresIniciaisEdicao } from '../utils/edicaoEntrada'
import { CamposCabecalhoEntrada } from './CamposCabecalhoEntrada'
import { TabelaCustosEdicao } from './TabelaCustosEdicao'

interface Props {
  entrada: EntradaMercadoria
  fornecedores: Pick<Fornecedor, 'id' | 'razaoSocial'>[]
}

export function FormularioEdicaoEntrada({ entrada, fornecedores }: Props) {
  const navigate = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const voltarParaDetalhe = (mensagem?: string) =>
    navigate(`/entradas/${entrada.id}`, mensagem ? { state: { mensagem } } : undefined)

  const form = useForm<EntradaEdicaoFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(entradaEdicaoSchema) as any,
    defaultValues: valoresIniciaisEdicao(entrada),
  })

  const onSubmit = async (valores: EntradaEdicaoFormValues) => {
    try {
      await entradasService.editar(entrada.id, montarEdicaoInput(valores, entrada))
      voltarParaDetalhe('Entrada atualizada com sucesso.')
    } catch (e) {
      setErro(extrairMensagemErro(e, 'Erro ao salvar alterações.'))
    }
  }

  return (
    <FormProvider {...form}>
      {erro && <Toast tipo="erro" mensagem={erro} onFechar={() => setErro(null)} />}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={form.handleSubmit(onSubmit as any)}>
        <FormCard>
          <FormSection titulo="Dados da Entrada" />
          <CamposCabecalhoEntrada fornecedores={fornecedores} />
          <FormSection titulo="Custos dos Itens" />
          <TabelaCustosEdicao itens={itensDaEntrada(entrada)} />
          <FormActions
            salvando={form.formState.isSubmitting}
            labelSalvar="Salvar alterações"
            onCancelar={() => voltarParaDetalhe()}
          />
        </FormCard>
      </form>
    </FormProvider>
  )
}
