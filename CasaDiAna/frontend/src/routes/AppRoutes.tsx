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
import { ProducaoVendasRelatorioPage } from '@/features/relatorios/pages/ProducaoVendasRelatorioPage'
import { InsumosProducaoPage } from '@/features/relatorios/pages/InsumosProducaoPage'
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage'
import { CorrecaoEstoquePage } from '@/features/estoque/correcao/pages/CorrecaoEstoquePage'
import { CategoriasProdutoPage } from '@/features/producao/categorias-produto/pages/CategoriasProdutoPage'
import { ProdutosPage } from '@/features/producao/produtos/pages/ProdutosPage'
import { ProdutoFormPage } from '@/features/producao/produtos/pages/ProdutoFormPage'
import { FichaTecnicaPage } from '@/features/producao/produtos/pages/FichaTecnicaPage'
import { ProducaoDiariaPage } from '@/features/producao/producao-diaria/pages/ProducaoDiariaPage'
import { RegistrarProducaoPage } from '@/features/producao/producao-diaria/pages/RegistrarProducaoPage'
import { VendasDiariasPage } from '@/features/producao/vendas-diarias/pages/VendasDiariasPage'
import { RegistrarVendaPage } from '@/features/producao/vendas-diarias/pages/RegistrarVendaPage'
import { PerdasPage } from '@/features/producao/perdas/pages/PerdasPage'
import { NotificacoesPage } from '@/features/notificacoes/pages/NotificacoesPage'
import { EtiquetasPage } from '@/features/etiquetas/pages/EtiquetasPage'
import { ImportacaoVendasPage } from '@/features/producao/importacao-vendas/pages/ImportacaoVendasPage'
import { MinhaContaPage } from '@/features/minha-conta/pages/MinhaContaPage'

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

          {/* Produção */}
          <Route path="/producao/categorias-produto" element={<CategoriasProdutoPage />} />
          <Route path="/producao/produtos" element={<ProdutosPage />} />
          <Route path="/producao/produtos/novo" element={<ProdutoFormPage />} />
          <Route path="/producao/produtos/:id/editar" element={<ProdutoFormPage />} />
          <Route path="/producao/produtos/:id/ficha-tecnica" element={<FichaTecnicaPage />} />
          <Route path="/producao/diaria" element={<ProducaoDiariaPage />} />
          <Route path="/producao/diaria/nova" element={<RegistrarProducaoPage />} />
          <Route path="/producao/vendas" element={<VendasDiariasPage />} />
          <Route path="/producao/vendas/nova" element={<RegistrarVendaPage />} />
          <Route path="/producao/perdas" element={<PerdasPage />} />
          <Route path="/producao/importacao-vendas" element={<ImportacaoVendasPage />} />

          {/* Relatórios */}
          <Route path="/relatorios/estoque-atual" element={<EstoqueAtualPage />} />
          <Route path="/relatorios/movimentacoes" element={<MovimentacoesPage />} />
          <Route path="/relatorios/entradas" element={<EntradasRelatorioPage />} />
          <Route path="/relatorios/producao-vendas" element={<ProducaoVendasRelatorioPage />} />
          <Route path="/relatorios/insumos-producao" element={<InsumosProducaoPage />} />

          {/* Estoque — Correção */}
          <Route path="/estoque/correcao" element={<CorrecaoEstoquePage />} />

          {/* Configurações */}
          <Route path="/usuarios" element={<UsuariosPage />} />

          {/* Notificações */}
          <Route path="/notificacoes" element={<NotificacoesPage />} />

          {/* Etiquetas */}
          <Route path="/etiquetas" element={<EtiquetasPage />} />

          {/* Minha Conta */}
          <Route path="/minha-conta" element={<MinhaContaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
