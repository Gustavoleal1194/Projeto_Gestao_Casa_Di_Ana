import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { ApiResponse, UnidadeMedida } from '@/types/estoque'

export function useUnidadesMedida() {
  const [unidades, setUnidades] = useState<UnidadeMedida[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<ApiResponse<UnidadeMedida[]>>('/unidades-medida')
      .then(r => setUnidades(r.data.dados))
      .catch(() => setUnidades([]))
      .finally(() => setLoading(false))
  }, [])

  return { unidades, loading }
}
