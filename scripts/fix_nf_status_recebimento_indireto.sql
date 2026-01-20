-- Script para corrigir status de NFs com RECEBIMENTO_INDIRETO
-- que estão com status PENDENTE_TRANSFERENCIA mas deveriam estar AGUARDANDO_CONFERENCIA
-- 
-- Executar manualmente no banco de produção
-- Data: 2026-01-20

-- Atualizar NFs com RECEBIMENTO_INDIRETO que têm filial de recebimento definida
-- e estão com status PENDENTE_TRANSFERENCIA (sem conferências)
UPDATE notas_fiscais
SET status = 'AGUARDANDO_CONFERENCIA',
    updated_at = NOW()
WHERE tipo_movimentacao = 'RECEBIMENTO_INDIRETO'
  AND filial_recebimento_id IS NOT NULL
  AND status = 'PENDENTE_TRANSFERENCIA'
  AND NOT EXISTS (
    SELECT 1 FROM conferencias_volumes cv 
    WHERE cv.nota_fiscal_id = notas_fiscais.id
  );

-- Verificar quantas NFs foram atualizadas
SELECT 
  COUNT(*) as total_atualizadas,
  'NFs com RECEBIMENTO_INDIRETO corrigidas' as descricao
FROM notas_fiscais
WHERE tipo_movimentacao = 'RECEBIMENTO_INDIRETO'
  AND filial_recebimento_id IS NOT NULL
  AND status = 'AGUARDANDO_CONFERENCIA'
  AND updated_at >= NOW() - INTERVAL '1 minute';
