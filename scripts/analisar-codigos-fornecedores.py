import csv
import psycopg2
from difflib import SequenceMatcher

# Conexão com o banco
conn = psycopg2.connect(
    host="147.93.144.135",
    port=4154,
    database="stoklink-v2",
    user="postgres",
    password="eca7acf5875ea693addb"
)

def similarity(a, b):
    """Calcula similaridade entre duas strings (0 a 1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalizar_cnpj(cnpj):
    """Remove caracteres especiais do CNPJ"""
    if not cnpj:
        return None
    return ''.join(filter(str.isdigit, str(cnpj)))

# Buscar todos os fornecedores do banco
cursor = conn.cursor()
cursor.execute("""
    SELECT id, nome, cnpj 
    FROM fornecedores 
    ORDER BY nome
""")
fornecedores_banco = cursor.fetchall()

print(f"\n📊 Total de fornecedores no banco: {len(fornecedores_banco)}")

# Ler CSV
fornecedores_csv = []
with open('dados-bezerra._public_._dim_fornecedor_.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        fornecedores_csv.append({
            'codigo': row['codfornec'],
            'nome': row['nome'],
            'cnpj': normalizar_cnpj(row['cgccpf'])
        })

print(f"📊 Total de fornecedores no CSV: {len(fornecedores_csv)}")

# Comparar
matches_exatos_cnpj = []
matches_exatos_nome = []
matches_similares = []
nao_encontrados = []

for csv_forn in fornecedores_csv:
    encontrado = False
    
    # Tentar match por CNPJ primeiro (mais confiável)
    if csv_forn['cnpj']:
        for banco_forn in fornecedores_banco:
            banco_cnpj = normalizar_cnpj(banco_forn[2])
            if banco_cnpj and csv_forn['cnpj'] == banco_cnpj:
                matches_exatos_cnpj.append({
                    'banco_id': banco_forn[0],
                    'banco_nome': banco_forn[1],
                    'banco_cnpj': banco_forn[2],
                    'csv_codigo': csv_forn['codigo'],
                    'csv_nome': csv_forn['nome'],
                    'csv_cnpj': csv_forn['cnpj']
                })
                encontrado = True
                break
    
    # Se não encontrou por CNPJ, tentar por nome exato
    if not encontrado:
        for banco_forn in fornecedores_banco:
            if csv_forn['nome'].upper() == banco_forn[1].upper():
                matches_exatos_nome.append({
                    'banco_id': banco_forn[0],
                    'banco_nome': banco_forn[1],
                    'banco_cnpj': banco_forn[2],
                    'csv_codigo': csv_forn['codigo'],
                    'csv_nome': csv_forn['nome'],
                    'csv_cnpj': csv_forn['cnpj']
                })
                encontrado = True
                break
    
    # Se não encontrou, tentar por similaridade de nome (>= 80%)
    if not encontrado:
        melhor_match = None
        melhor_score = 0
        
        for banco_forn in fornecedores_banco:
            score = similarity(csv_forn['nome'], banco_forn[1])
            if score >= 0.8 and score > melhor_score:
                melhor_score = score
                melhor_match = {
                    'banco_id': banco_forn[0],
                    'banco_nome': banco_forn[1],
                    'banco_cnpj': banco_forn[2],
                    'csv_codigo': csv_forn['codigo'],
                    'csv_nome': csv_forn['nome'],
                    'csv_cnpj': csv_forn['cnpj'],
                    'similaridade': round(score * 100, 1)
                }
        
        if melhor_match:
            matches_similares.append(melhor_match)
            encontrado = True
    
    if not encontrado:
        nao_encontrados.append(csv_forn)

# Relatório
print("\n" + "="*80)
print("📋 RELATÓRIO DE COMPARAÇÃO")
print("="*80)

print(f"\n✅ Matches EXATOS por CNPJ: {len(matches_exatos_cnpj)}")
if matches_exatos_cnpj:
    print("\nPrimeiros 10:")
    for i, match in enumerate(matches_exatos_cnpj[:10], 1):
        print(f"  {i}. [{match['csv_codigo']}] {match['csv_nome']}")
        print(f"     → {match['banco_nome']}")

print(f"\n✅ Matches EXATOS por NOME: {len(matches_exatos_nome)}")
if matches_exatos_nome:
    print("\nPrimeiros 10:")
    for i, match in enumerate(matches_exatos_nome[:10], 1):
        print(f"  {i}. [{match['csv_codigo']}] {match['csv_nome']}")
        print(f"     → {match['banco_nome']}")

print(f"\n⚠️  Matches SIMILARES (>80%): {len(matches_similares)}")
if matches_similares:
    print("\nPrimeiros 10:")
    for i, match in enumerate(matches_similares[:10], 1):
        print(f"  {i}. [{match['csv_codigo']}] {match['csv_nome']} ({match['similaridade']}%)")
        print(f"     → {match['banco_nome']}")

print(f"\n❌ NÃO encontrados no banco: {len(nao_encontrados)}")
if nao_encontrados:
    print("\nPrimeiros 10:")
    for i, forn in enumerate(nao_encontrados[:10], 1):
        print(f"  {i}. [{forn['codigo']}] {forn['nome']}")

# Salvar relatório completo em arquivo
with open('relatorio-comparacao-fornecedores.txt', 'w', encoding='utf-8') as f:
    f.write("="*80 + "\n")
    f.write("RELATÓRIO COMPLETO - COMPARAÇÃO FORNECEDORES CSV vs BANCO\n")
    f.write("="*80 + "\n\n")
    
    f.write(f"Total CSV: {len(fornecedores_csv)}\n")
    f.write(f"Total Banco: {len(fornecedores_banco)}\n\n")
    
    f.write(f"✅ Matches EXATOS por CNPJ: {len(matches_exatos_cnpj)}\n")
    f.write("-"*80 + "\n")
    for match in matches_exatos_cnpj:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']}\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Nome Banco: {match['banco_nome']}\n")
        f.write(f"  → CNPJ: {match['banco_cnpj']}\n\n")
    
    f.write(f"\n✅ Matches EXATOS por NOME: {len(matches_exatos_nome)}\n")
    f.write("-"*80 + "\n")
    for match in matches_exatos_nome:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']}\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Nome Banco: {match['banco_nome']}\n\n")
    
    f.write(f"\n⚠️  Matches SIMILARES (>80%): {len(matches_similares)}\n")
    f.write("-"*80 + "\n")
    for match in matches_similares:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']} ({match['similaridade']}%)\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Nome Banco: {match['banco_nome']}\n\n")
    
    f.write(f"\n❌ NÃO ENCONTRADOS: {len(nao_encontrados)}\n")
    f.write("-"*80 + "\n")
    for forn in nao_encontrados:
        f.write(f"[{forn['codigo']}] {forn['nome']}\n")
        f.write(f"  CNPJ: {forn['cnpj']}\n\n")

print("\n✅ Relatório completo salvo em: relatorio-comparacao-fornecedores.txt")

# Gerar SQL para atualização (apenas matches exatos por CNPJ)
with open('update-codigos-fornecedores.sql', 'w', encoding='utf-8') as f:
    f.write("-- Script para adicionar códigos aos fornecedores\n")
    f.write("-- Gerado automaticamente\n\n")
    f.write("-- 1. Adicionar coluna codigo (se não existir)\n")
    f.write("ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS codigo TEXT;\n\n")
    f.write("-- 2. Atualizar códigos (matches exatos por CNPJ)\n\n")
    
    for match in matches_exatos_cnpj:
        f.write(f"UPDATE fornecedores SET codigo = '{match['csv_codigo']}' WHERE id = '{match['banco_id']}';\n")
        f.write(f"-- {match['banco_nome']}\n\n")

print("✅ SQL gerado em: update-codigos-fornecedores.sql")

conn.close()

print("\n" + "="*80)
print("✅ Análise concluída!")
print("="*80)
