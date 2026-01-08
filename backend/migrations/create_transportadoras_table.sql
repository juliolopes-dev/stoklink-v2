-- Criar tabela de transportadoras
-- Execute este SQL diretamente no banco de dados

CREATE TABLE IF NOT EXISTS transportadoras (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id VARCHAR(36) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_transportadora_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  CONSTRAINT uk_transportadora_empresa_nome UNIQUE (empresa_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_transportadora_empresa ON transportadoras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transportadora_nome ON transportadoras(nome);
