import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface NotaFiscal {
  id: string
  numero: string
  numeroSecundario: string | null
  serie: string | null
  fornecedorNome: string
  fornecedor: {
    id: string
    nome: string
    codigo: string | null
  } | null
  fornecedorSecundario: {
    id: string
    nome: string
  } | null
  dataEmissao: string | null
  dataRecebimento: string | null
  quantidadeVolumes: number
  status: string
  tipoMovimentacao: string
  transportadora: string | null
  mercadoriaBloqueada: boolean
  entradaRp: boolean | null
  auditoriaRealizada: boolean
  dataAuditoria: string | null
  filialRecebimento: {
    id: string
    nome: string
    codigo: string
  } | null
  filialDestino: {
    id: string
    nome: string
    codigo: string
  }
  _count: {
    itens: number
    divergencias: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface NotasFiscaisResponse {
  data: NotaFiscal[]
  pagination: Pagination
}

interface NotasFiscaisFilters {
  status?: string
  searchTerm?: string
  dataEmissao?: string
  filialDestinoId?: string
  entradaRp?: string
  mercadoriaBloqueada?: string
  page?: number
  limit?: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

async function fetchNotasFiscais(filters: NotasFiscaisFilters): Promise<NotasFiscaisResponse> {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.searchTerm) params.append('searchTerm', filters.searchTerm)
  if (filters.dataEmissao) params.append('dataEmissao', filters.dataEmissao)
  if (filters.filialDestinoId) params.append('filialDestinoId', filters.filialDestinoId)
  if (filters.entradaRp) params.append('entradaRp', filters.entradaRp)
  if (filters.mercadoriaBloqueada) params.append('mercadoriaBloqueada', filters.mercadoriaBloqueada)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))

  const response = await api.get(`/notas-fiscais?${params.toString()}`)
  return response.data
}

export function useNotasFiscais(filters: NotasFiscaisFilters) {
  const debouncedSearchTerm = useDebounce(filters.searchTerm || '', 400)
  
  const queryFilters = {
    ...filters,
    searchTerm: debouncedSearchTerm || undefined
  }

  return useQuery({
    queryKey: ['notas-fiscais', queryFilters],
    queryFn: () => fetchNotasFiscais(queryFilters),
    placeholderData: (previousData) => previousData
  })
}

export type { NotaFiscal, NotasFiscaisFilters, NotasFiscaisResponse, Pagination }
