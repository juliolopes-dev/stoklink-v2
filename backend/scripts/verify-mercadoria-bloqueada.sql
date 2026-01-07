-- Script para verificar se a coluna mercadoria_bloqueada foi criada

-- Verificar se a coluna existe
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name = 'mercadoria_bloqueada';

-- Se retornar uma linha, a coluna foi criada com sucesso
-- Esperado:
-- column_name: mercadoria_bloqueada
-- data_type: boolean
-- column_default: true
-- is_nullable: NO
