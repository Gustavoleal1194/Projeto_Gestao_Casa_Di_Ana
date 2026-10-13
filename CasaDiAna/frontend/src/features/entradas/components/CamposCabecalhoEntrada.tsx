import { useFormContext } from 'react-hook-form'
import { CampoTexto } from '@/components/form/CampoTexto'
import { ComboboxCampo } from '@/components/form/ComboboxCampo'
import type { CabecalhoEntradaValues, Fornecedor } from '@/types/estoque'
import { SecaoBoletos } from './SecaoBoletos'

interface Props {
  fornecedores: Pick<Fornecedor, 'id' | 'razaoSocial'>[]
}

/** Campos de cabeçalho de entrada (registro e edição). Exige um FormProvider. */
export function CamposCabecalhoEntrada({ fornecedores }: Props) {
  const { control, register, formState: { errors } } = useFormContext<CabecalhoEntradaValues>()

  return (
    <div className="grid grid-cols-2 gap-4">
      <ComboboxCampo
        control={control}
        name="fornecedorId"
        label="Fornecedor"
        obrigatorio
        placeholder="Buscar fornecedor…"
        opcoes={fornecedores.map(f => ({ valor: f.id, rotulo: f.razaoSocial }))}
        erro={errors.fornecedorId?.message}
      />
      <CampoTexto
        label="Data da Entrada"
        obrigatorio
        type="date"
        {...register('dataEntrada')}
        erro={errors.dataEntrada?.message}
      />
      <CampoTexto
        label="Nota Fiscal"
        placeholder="Número da NF (opcional)"
        {...register('numeroNotaFiscal')}
      />
      <CampoTexto
        label="Recebido por"
        obrigatorio
        placeholder="Nome do funcionário que recebeu"
        {...register('recebidoPor')}
        erro={errors.recebidoPor?.message}
      />
      <CampoTexto
        label="Observações"
        placeholder="Observações (opcional)"
        {...register('observacoes')}
      />
      <SecaoBoletos />
    </div>
  )
}
