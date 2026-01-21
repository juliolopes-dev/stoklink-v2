import { Tooltip } from './Tooltip'

interface StatusBadgeProps {
  status: string
  tooltip?: string
  filialRecebimento?: string | null
}

const statusConfig: Record<string, { label: string; color: string; defaultTooltip?: string }> = {
  PENDENTE_TRANSFERENCIA: {
    label: 'Em Trânsito',
    color: 'bg-primary-100 text-primary-700',
    defaultTooltip: 'Mercadoria em trânsito'
  },
  VOLUMES_CONFERIDOS: {
    label: 'Volumes Conferidos',
    color: 'bg-info-100 text-info-700',
    defaultTooltip: 'Volumes conferidos, aguardando conferência de itens'
  },
  VOLUMES_DIVERGENTES: {
    label: 'Divergência em Volumes',
    color: 'bg-warning-100 text-warning-700',
    defaultTooltip: 'Divergência identificada na conferência de volumes'
  },
  AGUARDANDO_CONFERENCIA_DESTINO: {
    label: 'Aguard. Destino',
    color: 'bg-purple-100 text-purple-700',
    defaultTooltip: 'Aguardando conferência na filial destino'
  },
  EM_CONFERENCIA: {
    label: 'Em Conferência',
    color: 'bg-info-100 text-info-700',
    defaultTooltip: 'Conferência de itens em andamento'
  },
  CONFERIDO_OK: {
    label: 'Processo Finalizado',
    color: 'bg-success-100 text-success-700',
    defaultTooltip: 'Conferência concluída - Processo finalizado'
  },
  CONFERIDO_DIVERGENCIA: {
    label: 'Conferido c/ Divergência',
    color: 'bg-error-100 text-error-700',
    defaultTooltip: 'Conferência concluída com divergências'
  },
  BLOQUEADO: {
    label: 'Bloqueado',
    color: 'bg-gray-100 text-gray-700',
    defaultTooltip: 'NF bloqueada para movimentação'
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
