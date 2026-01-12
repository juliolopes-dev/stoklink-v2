-- Script para criar tabela de Audit Logs
-- Execute este script no banco de dados de produção

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID NOT NULL,
    acao VARCHAR(50) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    usuario_id UUID NOT NULL,
    usuario_nome VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Comentário: Esta tabela registra todas as alterações feitas no sistema
-- entidade: nome da tabela/modelo (ex: 'NotaFiscal', 'Usuario')
-- entidade_id: ID do registro alterado
-- acao: tipo de ação (CREATE, UPDATE, DELETE, STATUS_CHANGE, etc.)
-- dados_anteriores: estado anterior do registro (JSON)
-- dados_novos: novo estado do registro (JSON)
