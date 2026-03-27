import { useNavigate } from 'react-router-dom'
import {
  BeakerIcon,
  TagIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'

interface ModuloCard {
  titulo: string
  descricao: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  disponivel: boolean
  grupo: string
}

const modulos: ModuloCard[] = [
  {
    grupo: 'Cadastros',
    titulo: 'Ingredientes',
    descricao: 'Gerencie ingredientes, estoque mínimo e unidades de medida.',
    icon: BeakerIcon,
    href: '/estoque/ingredientes',
    disponivel: true,
  },
  {
    grupo: 'Cadastros',
    titulo: 'Categorias',
    descricao: 'Organize ingredientes por categoria (seco, líquido, etc.).',
    icon: TagIcon,
    href: '/estoque/categorias',
    disponivel: true,
  },
  {
    grupo: 'Cadastros',
    titulo: 'Fornecedores',
    descricao: 'Cadastre e gerencie os fornecedores da cafeteria.',
    icon: TruckIcon,
    href: '/fornecedores',
    disponivel: true,
  },
  {
    grupo: 'Movimentações',
    titulo: 'Entradas',
    descricao: 'Registre recebimentos de mercadoria e atualize o estoque.',
    icon: ArrowDownTrayIcon,
    href: '/entradas',
    disponivel: true,
  },
  {
    grupo: 'Movimentações',
    titulo: 'Inventário',
    descricao: 'Realize contagens de estoque e corrija divergências.',
    icon: ClipboardDocumentCheckIcon,
    href: '/inventarios',
    disponivel: true,
  },
  {
    grupo: 'Relatórios',
    titulo: 'Relatórios',
    descricao: 'Visualize estoque atual, movimentações e histórico de entradas.',
    icon: ChartBarSquareIcon,
    href: '/relatorios/estoque-atual',
    disponivel: true,
  },
]

const grupos = ['Cadastros', 'Movimentações', 'Relatórios']

export function DashboardPage() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()

  return (
    <div className="p-6 max-w-5xl">
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">
          Olá, {usuario?.nome?.split(' ')[0] ?? 'bem-vindo'}!
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          O que você vai gerenciar hoje?
        </p>
      </div>

      {/* Grupos de módulos */}
      <div className="space-y-8">
        {grupos.map(grupo => {
          const itens = modulos.filter(m => m.grupo === grupo)
          return (
            <section key={grupo}>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                {grupo}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map(modulo => {
                  const Icon = modulo.icon
                  return (
                    <div
                      key={modulo.href}
                      onClick={() => modulo.disponivel && navigate(modulo.href)}
                      className={`bg-white rounded-xl border border-stone-200 shadow-sm p-5
                                  flex flex-col gap-3 transition-all ${
                                    modulo.disponivel
                                      ? 'cursor-pointer hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5'
                                      : 'opacity-60 cursor-not-allowed'
                                  }`}
                    >
                      {/* Ícone + badge */}
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          modulo.disponivel ? 'bg-amber-50' : 'bg-stone-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            modulo.disponivel ? 'text-amber-700' : 'text-stone-400'
                          }`} />
                        </div>
                        {!modulo.disponivel && (
                          <span className="text-xs text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
                            em breve
                          </span>
                        )}
                      </div>

                      {/* Texto */}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-stone-800">{modulo.titulo}</p>
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{modulo.descricao}</p>
                      </div>

                      {/* CTA */}
                      {modulo.disponivel && (
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
                          Acessar
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
