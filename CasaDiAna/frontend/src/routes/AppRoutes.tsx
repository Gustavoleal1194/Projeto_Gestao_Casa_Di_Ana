import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { IngredientesPage } from '@/features/estoque/ingredientes/pages/IngredientesPage'
import { IngredienteFormPage } from '@/features/estoque/ingredientes/pages/IngredienteFormPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/estoque/ingredientes" element={<IngredientesPage />} />
        <Route path="/estoque/ingredientes/novo" element={<IngredienteFormPage />} />
        <Route path="/estoque/ingredientes/:id/editar" element={<IngredienteFormPage />} />
        <Route path="/" element={<Navigate to="/estoque/ingredientes" replace />} />
        <Route path="*" element={<Navigate to="/estoque/ingredientes" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
