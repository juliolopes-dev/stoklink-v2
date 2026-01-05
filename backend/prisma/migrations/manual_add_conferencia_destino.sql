-- Migration manual: Adicionar suporte a 2ª conferência de volumes
-- Execute este script no banco de dados de produção

-- 1. Criar enum TipoConferenciaVolume
DO $$ BEGIN
    CREATE TYPE "TipoConferenciaVolume" AS ENUM ('RECEBIMENTO', 'DESTINO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar novo status ao enum StatusNotaFiscal
ALTER TYPE "StatusNotaFiscal" ADD VALUE IF NOT EXISTS 'AGUARDANDO_CONFERENCIA_DESTINO';

-- 3. Adicionar colunas na tabela conferencias_volumes
ALTER TABLE "conferencias_volumes" 
ADD COLUMN IF NOT EXISTS "tipo" "TipoConferenciaVolume" DEFAULT 'RECEBIMENTO';

ALTER TABLE "conferencias_volumes" 
ADD COLUMN IF NOT EXISTS "filial_id" TEXT;

-- 4. Criar índice para a foreign key
CREATE INDEX IF NOT EXISTS "conferencias_volumes_filial_id_idx" ON "conferencias_volumes"("filial_id");

-- 5. Adicionar foreign key
DO $$ BEGIN
    ALTER TABLE "conferencias_volumes" 
    ADD CONSTRAINT "conferencias_volumes_filial_id_fkey" 
    FOREIGN KEY ("filial_id") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
