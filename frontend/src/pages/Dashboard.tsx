import { useEffect, useState } from 'react'
import { FiFileText, FiAlertTriangle, FiTruck, FiCheckCircle } from 'react-icons/fi'
import { api } from '../services/api'

interface ResumoData {
  notasFiscais: {
    total: number
    aguardando: number
    conferidas: number
  }
  divergencias: {
    total: number
    pendentes: number
  }
  distribuicoes: {
    pendentes: number
    urgentes: number
  }
}

export function Dashboard() {
  const [resumo, setResumo] = useState<ResumoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadResumo() {
      try {
        const [nfsRes, divRes, distRes] = await Promise.all([
          api.get('/notas-fiscais'),
          api.get('/divergencias/resumo'),
          api.get('/distribuicoes/resumo')
        ])

        const nfs = nfsRes.data
        const aguardando = nfs.filter((nf: { status: string }) => 
          ['AGUARDANDO_CONFERENCIA', 'VOLUMES_CONFERIDOS', 'BLOQUEADO'].includes(nf.status)
        ).length
        const conferidas = nfs.filter((nf: { status: string }) => 
          ['CONFERIDO_OK', 'CONFERIDO_DIVERGENCIA'].includes(nf.status)
        ).length

        setResumo({
          notasFiscais: {
            total: nfs.length,
            aguardando,
            conferidas
          },
          divergencias: {
            total: divRes.data.total,
            pendentes: divRes.data.pendentes
          },
          distribuicoes: {
            pendentes: distRes.data.pendentes,
            urgentes: distRes.data.urgentes
          }
        })
      } catch (error) {
        console.error('Erro ao carregar resumo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResumo()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiFileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Notas Fiscais</p>
              <p className="text-2xl font-bold text-gray-800">{resumo?.notasFiscais.total || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="text-yellow-600 font-medium">{resumo?.notasFiscais.aguardando || 0}</span> aguardando conferência
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conferidas</p>
              <p className="text-2xl font-bold text-gray-800">{resumo?.notasFiscais.conferidas || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-green-600">
              Notas finalizadas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiAlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Divergências</p>
              <p className="text-2xl font-bold text-gray-800">{resumo?.divergencias.pendentes || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="text-red-600 font-medium">{resumo?.divergencias.pendentes || 0}</span> pendentes de resolução
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiTruck className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distribuições</p>
              <p className="text-2xl font-bold text-gray-800">{resumo?.distribuicoes.pendentes || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="text-orange-600 font-medium">{resumo?.distribuicoes.urgentes || 0}</span> urgentes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
