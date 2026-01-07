# Script para executar migration de mercadoria_bloqueada no banco de produção
# Requer PostgreSQL client instalado

$env:PGPASSWORD = "eca7acf5875ea693addb"

$sqlContent = @"
-- Adicionar coluna mercadoria_bloqueada (default true = bloqueada)
DO `$`$ 
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
END `$`$;
"@

Write-Host "Executando migration no banco de produção..." -ForegroundColor Yellow
$sqlContent | & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h 147.93.144.135 -p 4154 -U postgres -d stoklink-v2

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration executada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao executar migration" -ForegroundColor Red
}
