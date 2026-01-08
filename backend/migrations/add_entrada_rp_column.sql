-- Adicionar coluna entrada_rp na tabela notas_fiscais
-- Execute este SQL diretamente no banco de dados

ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS entrada_rp BOOLEAN;
