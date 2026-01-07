-- Script SQL manual para adicionar campo transportadora na conferência de volumes
-- Executar manualmente no banco de produção

-- Adicionar coluna transportadora (se não existir)
ALTER TABLE conferencias_volumes 
ADD COLUMN IF NOT EXISTS transportadora VARCHAR(255);
