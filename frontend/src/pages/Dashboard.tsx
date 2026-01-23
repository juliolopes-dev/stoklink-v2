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

        const nfs = nfsRes.data.data || []
        const totalNfs = nfsRes.data.pagination?.total || nfs.length
        const aguardando = nfs.filter((nf: { status: string }) => 
          ['AGUARDANDO_CONFERENCIA', 'VOLUMES_CONFERIDOS', 'BLOQUEADO'].includes(nf.status)
        ).length
        const conferidas = nfs.filter((nf: { status: string }) => 
          ['CONFERIDO_OK', 'CONFERIDO_DIVERGENCIA'].includes(nf.status)
        ).length

        setResumo({
          notasFiscais: {
            total: totalNfs,
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
    <div className="h-full p-4">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-md">
              <FiFileText className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Notas Fiscais</p>
              <p className="text-xl font-semibold text-gray-800">{resumo?.notasFiscais.total || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="text-warning-600 font-medium">{resumo?.notasFiscais.aguardando || 0}</span> aguardando conferência
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-md">
              <FiCheckCircle className="text-success-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Conferidas</p>
              <p className="text-xl font-semibold text-gray-800">{resumo?.notasFiscais.conferidas || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-success-600">
              Notas finalizadas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-100 rounded-md">
              <FiAlertTriangle className="text-error-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Divergências</p>
              <p className="text-xl font-semibold text-gray-800">{resumo?.divergencias.pendentes || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="text-error-600 font-medium">{resumo?.divergencias.pendentes || 0}</span> pendentes de resolução
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-md">
              <FiTruck className="text-warning-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Distribuições</p>
              <p className="text-xl font-semibold text-gray-800">{resumo?.distribuicoes.pendentes || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="text-warning-600 font-medium">{resumo?.distribuicoes.urgentes || 0}</span> urgentes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
