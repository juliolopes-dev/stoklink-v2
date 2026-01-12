-- Migration: Adicionar perfil FINANCEIRO ao enum PerfilUsuario
-- Data: 12/01/2026
-- Descrição: Adiciona o perfil FINANCEIRO para usuários do setor financeiro

-- Adicionar valor FINANCEIRO ao enum PerfilUsuario se não existir
ALTER TYPE "PerfilUsuario" ADD VALUE IF NOT EXISTS 'FINANCEIRO';
