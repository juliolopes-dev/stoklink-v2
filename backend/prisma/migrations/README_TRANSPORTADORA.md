# Migration: Adicionar coluna transportadora

## Problema
A coluna `transportadora` não existe na tabela `conferencias_volumes` no banco de produção.

## Solução
Execute o script SQL abaixo no banco de produção.

## Conexão ao Banco de Produção
- Host: 147.93.144.135
- Porta: 4154
- Database: stoklink-v2
- User: postgres

## Script SQL para executar

```sql
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
```

## Como executar

### Opção 1: Via psql
```bash
psql -h 147.93.144.135 -p 4154 -U postgres -d stoklink-v2 -f add_transportadora_column.sql
```

### Opção 2: Via DBeaver/pgAdmin
1. Conecte ao banco de produção
2. Abra o arquivo `add_transportadora_column.sql`
3. Execute o script

### Opção 3: Copiar e colar
Copie o conteúdo do script SQL acima e execute diretamente no banco.

## Verificação
Após executar, verifique se a coluna foi criada:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conferencias_volumes' 
AND column_name = 'transportadora';
```

## Após a migration
Depois de executar a migration no banco de produção, faça o redeploy da aplicação para que o Prisma Client seja regenerado com a nova coluna.
