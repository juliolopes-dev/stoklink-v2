-- Script SQL para adicionar coluna numero_transferencia na tabela Pedido_DRP
-- Execute este script diretamente no banco de dados BD-BEZERRA

-- Adicionar coluna numero_transferencia
ALTER TABLE auditoria_integracao."Pedido_DRP"
ADD COLUMN IF NOT EXISTS numero_transferencia VARCHAR(50);

-- Verificar se a coluna foi criada
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'auditoria_integracao'
  AND table_name = 'Pedido_DRP'
  AND column_name = 'numero_transferencia';
