-- Migration: Adicionar coluna mercadoria_bloqueada na tabela notas_fiscais
-- Data: 2026-01-07
-- Descrição: Adiciona campo para controlar se a mercadoria está bloqueada ou liberada para venda

-- Adicionar coluna mercadoria_bloqueada (default true = bloqueada)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' 
        AND column_name = 'mercadoria_bloqueada'
    ) THEN
        ALTER TABLE notas_fiscais 
        ADD COLUMN mercadoria_bloqueada BOOLEAN NOT NULL DEFAULT true;
        
        RAISE NOTICE 'Coluna mercadoria_bloqueada adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna mercadoria_bloqueada já existe';
    END IF;
END $$;
