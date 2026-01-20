import { Tooltip } from './Tooltip'

interface StatusBadgeProps {
  status: string
  tooltip?: string
  filialRecebimento?: string | null
}

const statusConfig: Record<string, { label: string; color: string; defaultTooltip?: string }> = {
  AGUARDANDO_CONFERENCIA: {
    label: 'Aguardando Recebimento',
    color: 'bg-warning-100 text-warning-700',
    defaultTooltip: 'Aguardando chegada da mercadoria'
  },
  VOLUMES_CONFERIDOS: {
    label: 'Volumes Conferidos',
    color: 'bg-info-100 text-info-700',
    defaultTooltip: 'Volumes conferidos, aguardando conferência de itens'
  },
  VOLUMES_DIVERGENTES: {
    label: 'Divergência',
    color: 'bg-warning-100 text-warning-700',
    defaultTooltip: 'Divergência em volumes'
  },
  BLOQUEADO: {
    label: 'Bloqueado',
    color: 'bg-gray-100 text-gray-700'
  },
  EM_CONFERENCIA: {
    label: 'Em Conferência',
    color: 'bg-info-100 text-info-700',
    defaultTooltip: 'Conferência de produtos em andamento'
  },
  CONFERIDO_DIVERGENCIA: {
    label: 'Conferido c/ Divergência',
    color: 'bg-error-100 text-error-700',
    defaultTooltip: 'Conferência concluída com divergências em produtos'
  },
  CONFERIDO_OK: {
    label: 'Conferido',
    color: 'bg-success-100 text-success-700',
    defaultTooltip: 'Conferência de volumes e produtos OK'
  },
  PENDENTE_TRANSFERENCIA: {
    label: 'Em Trânsito',
    color: 'bg-primary-100 text-primary-700',
    defaultTooltip: 'Volumes conferidos na filial de recebimento - Em trânsito para filial destino'
  },
  AGUARDANDO_CONFERENCIA_DESTINO: {
    label: 'Aguard. Destino',
    color: 'bg-primary-100 text-primary-700',
    defaultTooltip: 'Volumes conferidos - Aguardando conferência na filial destino'
  }
}

export function StatusBadge({ status, tooltip, filialRecebimento }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800'
  }

  let tooltipText = tooltip || config.defaultTooltip
  
  // Adicionar informação da filial de recebimento se disponível
  if (filialRecebimento && tooltipText) {
    tooltipText = `${tooltipText}\nRecebida na filial: ${filialRecebimento}`
  } else if (filialRecebimento && !tooltipText) {
    tooltipText = `Recebida na filial: ${filialRecebimento}`
  }

  const badge = (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
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
