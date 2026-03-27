import { useState, useEffect } from 'react'
import { categoriasService } from '../services/categoriasService'
import type { CategoriaIngrediente } from '@/types/estoque'

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriasService
      .listar()
      .then(setCategorias)
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false))
  }, [])

  return { categorias, loading }
}
