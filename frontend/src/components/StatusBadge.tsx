import { Tooltip } from './Tooltip'

interface StatusBadgeProps {
  status: string
  tooltip?: string
}

const statusConfig: Record<string, { label: string; color: string; defaultTooltip?: string }> = {
  AGUARDANDO_CONFERENCIA: {
    label: 'Aguardando Conferência',
    color: 'bg-yellow-100 text-yellow-800',
    defaultTooltip: 'Aguardando conferência de volumes'
  },
  VOLUMES_CONFERIDOS: {
    label: 'Volumes Conferidos',
    color: 'bg-blue-100 text-blue-800',
    defaultTooltip: 'Volumes conferidos, aguardando conferência de produtos'
  },
  VOLUMES_DIVERGENTES: {
    label: 'Divergência',
    color: 'bg-orange-100 text-orange-800',
    defaultTooltip: 'Divergência em volumes'
  },
  BLOQUEADO: {
    label: 'Bloqueado',
    color: 'bg-gray-100 text-gray-800'
  },
  EM_CONFERENCIA: {
    label: 'Em Conferência',
    color: 'bg-cyan-100 text-cyan-800',
    defaultTooltip: 'Conferência de produtos em andamento'
  },
  CONFERIDO_DIVERGENCIA: {
    label: 'Divergência',
    color: 'bg-red-100 text-red-800',
    defaultTooltip: 'Divergência em produtos'
  },
  CONFERIDO_OK: {
    label: 'Conferido',
    color: 'bg-green-100 text-green-800',
    defaultTooltip: 'Conferência de volumes e produtos OK'
  },
  PENDENTE_TRANSFERENCIA: {
    label: 'Pend. Transferência',
    color: 'bg-purple-100 text-purple-800',
    defaultTooltip: 'Volumes OK - Aguardando conferência de itens e transferência para filial destino'
  },
  AGUARDANDO_CONFERENCIA_DESTINO: {
    label: 'Aguard. Destino',
    color: 'bg-indigo-100 text-indigo-800',
    defaultTooltip: 'Volumes conferidos - Aguardando conferência na filial destino'
  }
}

export function StatusBadge({ status, tooltip }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800'
  }

  const tooltipText = tooltip || config.defaultTooltip

  const badge = (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default ${config.color}`}>
      {config.label}
    </span>
  )

  if (tooltipText) {
    return (
      <Tooltip content={tooltipText}>
        {badge}
      </Tooltip>
    )
  }

  return badge
}
