-- Migration: Tornar dataRecebimento nullable e remover valor padrão
-- Data: 12/01/2026
-- Descrição: dataRecebimento deve ser preenchido apenas quando a conferência física for realizada, não no cadastro

-- Alterar coluna para nullable e remover default
ALTER TABLE notas_fiscais 
ALTER COLUMN data_recebimento DROP DEFAULT,
ALTER COLUMN data_recebimento DROP NOT NULL;

-- Limpar dataRecebimento de NFs que ainda não foram conferidas
-- (NFs com status que indica que a mercadoria ainda não foi fisicamente recebida)
UPDATE notas_fiscais 
SET data_recebimento = NULL 
WHERE status IN (
  'AGUARDANDO_CONFERENCIA', 
  'PENDENTE_TRANSFERENCIA', 
  'EM_TRANSITO',
  'AGUARDANDO_CONFERENCIA_DESTINO'
);

-- Comentário explicativo
COMMENT ON COLUMN notas_fiscais.data_recebimento IS 'Data em que a mercadoria foi fisicamente recebida (preenchido na conferência de volumes)';
