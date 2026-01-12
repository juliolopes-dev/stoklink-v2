-- Migration: Tornar dataRecebimento nullable e remover valor padrão
-- Data: 12/01/2026
-- Descrição: dataRecebimento deve ser preenchido apenas quando a conferência física for realizada, não no cadastro

-- Alterar coluna para nullable e remover default
ALTER TABLE notas_fiscais 
ALTER COLUMN data_recebimento DROP DEFAULT,
ALTER COLUMN data_recebimento DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN notas_fiscais.data_recebimento IS 'Data em que a mercadoria foi fisicamente recebida (preenchido na conferência de volumes)';
