import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { MainLayout } from '@/components/layout/MainLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { IngredientesPage } from '@/features/estoque/ingredientes/pages/IngredientesPage'
import { IngredienteFormPage } from '@/features/estoque/ingredientes/pages/IngredienteFormPage'
import { CategoriasPage } from '@/features/estoque/categorias/pages/CategoriasPage'
import { FornecedoresPage } from '@/features/fornecedores/pages/FornecedoresPage'
import { FornecedorFormPage } from '@/features/fornecedores/pages/FornecedorFormPage'
import { EntradasPage } from '@/features/entradas/pages/EntradasPage'
import { EntradaFormPage } from '@/features/entradas/pages/EntradaFormPage'
import { EntradaDetalhePage } from '@/features/entradas/pages/EntradaDetalhePage'
import { InventariosPage } from '@/features/inventarios/pages/InventariosPage'
import { InventarioFormPage } from '@/features/inventarios/pages/InventarioFormPage'
import { InventarioDetalhePage } from '@/features/inventarios/pages/InventarioDetalhePage'
import { EstoqueAtualPage } from '@/features/relatorios/pages/EstoqueAtualPage'
import { MovimentacoesPage } from '@/features/relatorios/pages/MovimentacoesPage'
import { EntradasRelatorioPage } from '@/features/relatorios/pages/EntradasRelatorioPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Estoque */}
          <Route path="/estoque/ingredientes" element={<IngredientesPage />} />
          <Route path="/estoque/ingredientes/novo" element={<IngredienteFormPage />} />
          <Route path="/estoque/ingredientes/:id/editar" element={<IngredienteFormPage />} />
          <Route path="/estoque/categorias" element={<CategoriasPage />} />

          {/* Fornecedores */}
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/fornecedores/novo" element={<FornecedorFormPage />} />
          <Route path="/fornecedores/:id/editar" element={<FornecedorFormPage />} />

          {/* Entradas */}
          <Route path="/entradas" element={<EntradasPage />} />
          <Route path="/entradas/nova" element={<EntradaFormPage />} />
          <Route path="/entradas/:id" element={<EntradaDetalhePage />} />

          {/* Inventários */}
          <Route path="/inventarios" element={<InventariosPage />} />
          <Route path="/inventarios/novo" element={<InventarioFormPage />} />
          <Route path="/inventarios/:id" element={<InventarioDetalhePage />} />

          {/* Relatórios */}
          <Route path="/relatorios/estoque-atual" element={<EstoqueAtualPage />} />
          <Route path="/relatorios/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/relatorios/entradas" element={<EntradasRelatorioPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
