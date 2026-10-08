import { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { useController } from 'react-hook-form'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface OpcaoCombobox {
  valor: string | number
  rotulo: string
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function valorComoTexto(valor: string | number): string {
  return String(valor)
}

interface PropsBase {
  id: string
  valorTexto: string
  onSelecionar: (valorTexto: string) => void
  onBlur?: () => void
  label: string
  opcoes: OpcaoCombobox[]
  erro?: string
  obrigatorio?: boolean
  placeholder?: string
  disabled?: boolean
}

function ComboboxCampoBase({
  id,
  valorTexto,
  onSelecionar,
  onBlur,
  label,
  opcoes,
  erro,
  obrigatorio,
  placeholder,
  disabled,
}: PropsBase) {
  const [query, setQuery] = useState('')

  const opcoesFiltradas = query === ''
    ? opcoes
    : opcoes.filter(o => normalizar(o.rotulo).includes(normalizar(query)))

  const opcaoSelecionada = opcoes.find(o => valorComoTexto(o.valor) === valorTexto) ?? null

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
        style={{ color: 'var(--ada-muted)', fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {label}{obrigatorio && <span className="ml-0.5" style={{ color: '#F87171' }} aria-hidden="true">*</span>}
      </label>

      <Combobox
        value={valorTexto}
        onChange={(valor: string | null) => {
          onSelecionar(valor ?? '')
          setQuery('')
        }}
        onClose={() => setQuery('')}
        disabled={disabled}
      >
        <div className="relative">
          <Combobox.Input
            id={id}
            aria-required={obrigatorio}
            aria-invalid={!!erro}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150 pr-16"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${erro ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.08)'}`,
              color: 'var(--ada-heading)',
              colorScheme: 'dark',
            }}
            displayValue={() => opcaoSelecionada?.rotulo ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder ?? 'Buscar…'}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {!obrigatorio && !disabled && Boolean(valorTexto) && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => { onSelecionar(''); setQuery('') }}
                className="p-0.5 rounded transition-colors"
                style={{ color: 'var(--ada-muted)' }}
                aria-label="Limpar seleção"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
            <Combobox.Button className="flex items-center">
              <ChevronUpDownIcon className="h-4 w-4" style={{ color: 'var(--ada-muted)' }} aria-hidden="true" />
            </Combobox.Button>
          </div>

          <Combobox.Options
            anchor="bottom start"
            className="z-[60] mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg py-1 text-sm shadow-lg outline-none"
            style={{ background: 'var(--ada-surface)', border: '1px solid var(--ada-border)' }}
          >
            {opcoesFiltradas.length === 0 ? (
              <div className="px-3 py-2 text-sm" style={{ color: 'var(--ada-muted)' }}>
                Nenhum resultado encontrado.
              </div>
            ) : (
              opcoesFiltradas.map(o => (
                <Combobox.Option key={o.valor} value={valorComoTexto(o.valor)}>
                  {({ active, selected }) => (
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer select-none ${selected ? 'font-semibold' : 'font-normal'}`}
                      style={{
                        background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                        color: 'var(--ada-heading)',
                      }}
                    >
                      {o.rotulo}
                    </div>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>

      {erro && (
        <p className="text-xs" style={{ color: 'var(--ada-error-text)' }} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

interface Props<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  opcoes: OpcaoCombobox[]
  erro?: string
  obrigatorio?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
}

/** Select com busca integrado ao React Hook Form (via control/name). */
export function ComboboxCampo<T extends FieldValues>({
  control,
  name,
  label,
  opcoes,
  erro,
  obrigatorio,
  placeholder,
  disabled,
  id,
}: Props<T>) {
  const { field } = useController({ control, name })
  const comboboxId = id ?? `combobox-${String(name).replace(/\./g, '-')}`

  return (
    <ComboboxCampoBase
      id={comboboxId}
      valorTexto={field.value != null ? valorComoTexto(field.value) : ''}
      onSelecionar={(valorTexto) => {
        if (!valorTexto) {
          field.onChange('')
          return
        }
        const opcaoEscolhida = opcoes.find(o => valorComoTexto(o.valor) === valorTexto)
        field.onChange(opcaoEscolhida?.valor ?? '')
      }}
      onBlur={field.onBlur}
      label={label}
      opcoes={opcoes}
      erro={erro}
      obrigatorio={obrigatorio}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}

interface PropsControlado {
  value: string
  onChange: (valor: string) => void
  onBlur?: () => void
  label: string
  opcoes: OpcaoCombobox[]
  erro?: string
  obrigatorio?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
}

/** Select com busca controlado diretamente por value/onChange, para telas sem React Hook Form. */
export function ComboboxCampoControlado({
  value,
  onChange,
  onBlur,
  label,
  opcoes,
  erro,
  obrigatorio,
  placeholder,
  disabled,
  id,
}: PropsControlado) {
  const comboboxId = id ?? `combobox-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <ComboboxCampoBase
      id={comboboxId}
      valorTexto={value}
      onSelecionar={onChange}
      onBlur={onBlur}
      label={label}
      opcoes={opcoes}
      erro={erro}
      obrigatorio={obrigatorio}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
