import { Tooltip } from './Tooltip'

interface StatusBadgeProps {
  status: string
  tooltip?: string
  filialRecebimento?: string | null
  mercadoriaBloqueada?: boolean
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
    label: 'Conferido',
    color: 'bg-success-100 text-success-700',
    defaultTooltip: 'Conferência concluída'
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
  },
  SEPARACAO_FINALIZADA: {
    label: 'Separação Finalizada',
    color: 'bg-green-100 text-green-700',
    defaultTooltip: 'Separação dos itens finalizada - Distribuição Imediata'
  }
}

export function StatusBadge({ status, tooltip, filialRecebimento, mercadoriaBloqueada }: StatusBadgeProps) {
  const config = { ...(statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800'
  }) }

  // Lógica para "Processo Finalizado" sugerida pelo Julio
  // Só aparece se estiver conferido e LIBERADO
  if ((status === 'CONFERIDO_OK' || status === 'CONFERIDO_DIVERGENCIA') && mercadoriaBloqueada === false) {
    config.label = 'Processo Finalizado'
    config.color = 'bg-success-100 text-success-700'
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
