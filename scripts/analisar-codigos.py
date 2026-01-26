import csv
from difflib import SequenceMatcher
import json

def similarity(a, b):
    """Calcula similaridade entre duas strings (0 a 1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalizar_cnpj(cnpj):
    """Remove caracteres especiais do CNPJ"""
    if not cnpj:
        return None
    return ''.join(filter(str.isdigit, str(cnpj)))

# Ler fornecedores do banco (copiar resultado do MCP query)
print("Cole o resultado da query do banco (JSON array) e pressione Enter duas vezes:")
print("Query: SELECT id, nome, cnpj FROM fornecedores ORDER BY nome")
print()

# Para facilitar, vou ler de um arquivo JSON que você vai criar
try:
    with open('fornecedores-banco.json', 'r', encoding='utf-8') as f:
        fornecedores_banco = json.load(f)
    print(f"✅ Lidos {len(fornecedores_banco)} fornecedores do banco")
except FileNotFoundError:
    print("❌ Arquivo 'fornecedores-banco.json' não encontrado!")
    print("Execute a query no MCP e salve o resultado em fornecedores-banco.json")
    exit(1)

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

print(f"✅ Lidos {len(fornecedores_csv)} fornecedores do CSV")

# Comparar
matches_exatos_cnpj = []
matches_exatos_nome = []
matches_similares = []
nao_encontrados = []

for csv_forn in fornecedores_csv:
    encontrado = False
    
    # Tentar match por CNPJ primeiro
    if csv_forn['cnpj']:
        for banco_forn in fornecedores_banco:
            banco_cnpj = normalizar_cnpj(banco_forn.get('cnpj'))
            if banco_cnpj and csv_forn['cnpj'] == banco_cnpj:
                matches_exatos_cnpj.append({
                    'banco_id': banco_forn['id'],
                    'banco_nome': banco_forn['nome'],
                    'banco_cnpj': banco_forn.get('cnpj'),
                    'csv_codigo': csv_forn['codigo'],
                    'csv_nome': csv_forn['nome'],
                    'csv_cnpj': csv_forn['cnpj']
                })
                encontrado = True
                break
    
    # Tentar por nome exato
    if not encontrado:
        for banco_forn in fornecedores_banco:
            if csv_forn['nome'].upper() == banco_forn['nome'].upper():
                matches_exatos_nome.append({
                    'banco_id': banco_forn['id'],
                    'banco_nome': banco_forn['nome'],
                    'banco_cnpj': banco_forn.get('cnpj'),
                    'csv_codigo': csv_forn['codigo'],
                    'csv_nome': csv_forn['nome'],
                    'csv_cnpj': csv_forn['cnpj']
                })
                encontrado = True
                break
    
    # Tentar por similaridade
    if not encontrado:
        melhor_match = None
        melhor_score = 0
        
        for banco_forn in fornecedores_banco:
            score = similarity(csv_forn['nome'], banco_forn['nome'])
            if score >= 0.8 and score > melhor_score:
                melhor_score = score
                melhor_match = {
                    'banco_id': banco_forn['id'],
                    'banco_nome': banco_forn['nome'],
                    'banco_cnpj': banco_forn.get('cnpj'),
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
print(f"✅ Matches EXATOS por NOME: {len(matches_exatos_nome)}")
print(f"⚠️  Matches SIMILARES (>80%): {len(matches_similares)}")
print(f"❌ NÃO encontrados: {len(nao_encontrados)}")

# Salvar relatório
with open('relatorio-comparacao.txt', 'w', encoding='utf-8') as f:
    f.write("="*80 + "\n")
    f.write("RELATÓRIO COMPLETO - COMPARAÇÃO FORNECEDORES\n")
    f.write("="*80 + "\n\n")
    
    f.write(f"✅ Matches EXATOS por CNPJ: {len(matches_exatos_cnpj)}\n")
    f.write("-"*80 + "\n")
    for match in matches_exatos_cnpj:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']}\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Banco: {match['banco_nome']}\n\n")
    
    f.write(f"\n✅ Matches EXATOS por NOME: {len(matches_exatos_nome)}\n")
    f.write("-"*80 + "\n")
    for match in matches_exatos_nome:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']}\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Banco: {match['banco_nome']}\n\n")
    
    f.write(f"\n⚠️  Matches SIMILARES: {len(matches_similares)}\n")
    f.write("-"*80 + "\n")
    for match in matches_similares:
        f.write(f"[{match['csv_codigo']}] {match['csv_nome']} ({match['similaridade']}%)\n")
        f.write(f"  → ID: {match['banco_id']}\n")
        f.write(f"  → Banco: {match['banco_nome']}\n\n")
    
    f.write(f"\n❌ NÃO ENCONTRADOS: {len(nao_encontrados)}\n")
    f.write("-"*80 + "\n")
    for forn in nao_encontrados:
        f.write(f"[{forn['codigo']}] {forn['nome']}\n\n")

print("\n✅ Relatório salvo em: relatorio-comparacao.txt")

# Gerar mapeamento para script TypeScript
mapeamento = []
for match in matches_exatos_cnpj:
    mapeamento.append({
        'id': match['banco_id'],
        'codigo': match['csv_codigo'],
        'nome': match['banco_nome']
    })

with open('mapeamento-codigos.json', 'w', encoding='utf-8') as f:
    json.dump(mapeamento, f, indent=2, ensure_ascii=False)

print(f"✅ Mapeamento salvo em: mapeamento-codigos.json ({len(mapeamento)} fornecedores)")
print("\n" + "="*80)
