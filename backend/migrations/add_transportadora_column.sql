-- Adicionar coluna transportadora na tabela conferencias_volumes
-- Execute este SQL diretamente no banco de dados

ALTER TABLE conferencias_volumes 
ADD COLUMN IF NOT EXISTS transportadora VARCHAR(255);
