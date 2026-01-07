-- Migration: Adicionar coluna transportadora na tabela conferencias_volumes
-- Data: 2026-01-07
-- Descrição: Adiciona campo para armazenar nome da transportadora nas conferências de volumes

-- Verificar e adicionar coluna transportadora
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conferencias_volumes' 
        AND column_name = 'transportadora'
    ) THEN
        ALTER TABLE conferencias_volumes 
        ADD COLUMN transportadora VARCHAR(255);
        
        RAISE NOTICE 'Coluna transportadora adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna transportadora já existe';
    END IF;
END $$;
