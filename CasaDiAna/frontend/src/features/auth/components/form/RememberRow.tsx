interface RememberRowProps {
  manter: boolean
  onManterChange: (v: boolean) => void
  onEsqueciSenha: () => void
  disabled?: boolean
}

export function RememberRow({ manter, onManterChange, onEsqueciSenha, disabled }: RememberRowProps) {
  return (
    <div className="lr-row">
      <label className="lr-check">
        <input
          type="checkbox"
          checked={manter}
          disabled={disabled}
          onChange={e => onManterChange(e.target.checked)}
        />
        Manter conectado
      </label>
      <button type="button" className="lr-linkbtn" onClick={onEsqueciSenha}>
        Esqueci minha senha
      </button>
    </div>
  )
}
