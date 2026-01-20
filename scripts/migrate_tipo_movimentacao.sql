-- Script para migrar tipos de movimentação
-- De: RECEBIMENTO_DIRETO, RECEBIMENTO_INDIRETO, DISTRIBUICAO_URGENTE
-- Para: NORMAL, DISTRIBUICAO_IMEDIATA
-- 
-- Executar manualmente no banco de produção
-- Data: 2026-01-20

-- Passo 1: Adicionar novos valores ao enum
ALTER TYPE "TipoMovimentacao" ADD VALUE IF NOT EXISTS 'NORMAL';
ALTER TYPE "TipoMovimentacao" ADD VALUE IF NOT EXISTS 'DISTRIBUICAO_IMEDIATA';

-- Passo 2: Migrar dados existentes
-- RECEBIMENTO_DIRETO e RECEBIMENTO_INDIRETO -> NORMAL
-- DISTRIBUICAO_URGENTE -> DISTRIBUICAO_IMEDIATA
UPDATE notas_fiscais 
SET tipo_movimentacao = 'NORMAL' 
WHERE tipo_movimentacao IN ('RECEBIMENTO_DIRETO', 'RECEBIMENTO_INDIRETO');

UPDATE notas_fiscais 
SET tipo_movimentacao = 'DISTRIBUICAO_IMEDIATA' 
WHERE tipo_movimentacao = 'DISTRIBUICAO_URGENTE';

-- Passo 3: Remover valores antigos do enum (requer recriação do enum)
-- ATENÇÃO: Este passo pode ser executado após confirmar que todos os dados foram migrados
-- e que a aplicação está funcionando corretamente com os novos valores

-- Verificar se ainda existem registros com valores antigos
SELECT tipo_movimentacao, COUNT(*) 
FROM notas_fiscais 
GROUP BY tipo_movimentacao;

-- Se não houver mais registros com valores antigos, podemos remover os valores do enum
-- Isso requer recriação do tipo, então vamos deixar para uma manutenção futura
-- Os valores antigos não causarão problemas, apenas não serão mais usados
