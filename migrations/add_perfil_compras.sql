-- Migration: Adicionar perfil COMPRAS ao enum PerfilUsuario
-- Data: 12/01/2026
-- Descrição: Adiciona o perfil COMPRAS para usuários do setor de compras

-- Adicionar valor COMPRAS ao enum PerfilUsuario se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'COMPRAS' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'PerfilUsuario'
        )
    ) THEN
        ALTER TYPE "PerfilUsuario" ADD VALUE 'COMPRAS';
    END IF;
END $$;
