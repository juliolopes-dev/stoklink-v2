import csv
import json
from difflib import SequenceMatcher

def similarity(a, b):
    """Calcula similaridade entre duas strings (0 a 1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalizar_cnpj(cnpj):
    """Remove caracteres especiais do CNPJ"""
    if not cnpj:
        return None
    return ''.join(filter(str.isdigit, str(cnpj)))

# Ler CSV
print("Lendo CSV...")
fornecedores_csv = []
with open('dados-bezerra._public_._dim_fornecedor_.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        fornecedores_csv.append({
            'codigo': row['codfornec'],
            'nome': row['nome'],
            'cnpj': normalizar_cnpj(row['cgccpf'])
        })

print(f"✅ CSV: {len(fornecedores_csv)} fornecedores")

# Ler JSON do banco (resultado do MCP)
print("Lendo dados do banco...")
with open('fornecedores-banco.json', 'r', encoding='utf-8') as f:
    fornecedores_banco = json.load(f)

print(f"✅ Banco: {len(fornecedores_banco)} fornecedores")

# Comparar
matches_cnpj = []
matches_nome = []
matches_similar = []
nao_encontrados = []

print("\nComparando...")
for csv_forn in fornecedores_csv:
    encontrado = False
    
    # Match por CNPJ
    if csv_forn['cnpj']:
        for banco_forn in fornecedores_banco:
            banco_cnpj = normalizar_cnpj(banco_forn.get('cnpj'))
            if banco_cnpj and csv_forn['cnpj'] == banco_cnpj:
                matches_cnpj.append({
                    'id': banco_forn['id'],
                    'codigo': csv_forn['codigo'],
                    'nome_banco': banco_forn['nome'],
                    'nome_csv': csv_forn['nome'],
                    'cnpj': banco_forn.get('cnpj')
                })
                encontrado = True
                break
    
    # Match por nome
    if not encontrado:
        for banco_forn in fornecedores_banco:
            if csv_forn['nome'].upper() == banco_forn['nome'].upper():
                matches_nome.append({
                    'id': banco_forn['id'],
                    'codigo': csv_forn['codigo'],
                    'nome_banco': banco_forn['nome'],
                    'nome_csv': csv_forn['nome'],
                    'cnpj': banco_forn.get('cnpj')
                })
                encontrado = True
                break
    
    # Match por similaridade
    if not encontrado:
        melhor = None
        melhor_score = 0
        
        for banco_forn in fornecedores_banco:
            score = similarity(csv_forn['nome'], banco_forn['nome'])
            if score >= 0.8 and score > melhor_score:
                melhor_score = score
                melhor = {
                    'id': banco_forn['id'],
                    'codigo': csv_forn['codigo'],
                    'nome_banco': banco_forn['nome'],
                    'nome_csv': csv_forn['nome'],
                    'cnpj': banco_forn.get('cnpj'),
                    'similaridade': round(score * 100, 1)
                }
        
        if melhor:
            matches_similar.append(melhor)
            encontrado = True
    
    if not encontrado:
        nao_encontrados.append(csv_forn)

# Relatório
print("\n" + "="*80)
print("📋 RESULTADO")
print("="*80)
print(f"✅ CNPJ: {len(matches_cnpj)}")
print(f"✅ Nome: {len(matches_nome)}")
print(f"⚠️  Similar: {len(matches_similar)}")
print(f"❌ Não encontrados: {len(nao_encontrados)}")

# Salvar mapeamento
todos_matches = matches_cnpj + matches_nome
with open('mapeamento-codigos.json', 'w', encoding='utf-8') as f:
    json.dump(todos_matches, f, indent=2, ensure_ascii=False)

print(f"\n✅ Mapeamento: mapeamento-codigos.json ({len(todos_matches)} fornecedores)")

# Salvar relatório completo
with open('relatorio-completo.txt', 'w', encoding='utf-8') as f:
    f.write("MATCHES POR CNPJ\n" + "="*80 + "\n")
    for m in matches_cnpj:
        f.write(f"[{m['codigo']}] {m['nome_csv']}\n")
        f.write(f"  → {m['nome_banco']}\n\n")
    
    f.write("\n\nMATCHES POR NOME\n" + "="*80 + "\n")
    for m in matches_nome:
        f.write(f"[{m['codigo']}] {m['nome_csv']}\n")
        f.write(f"  → {m['nome_banco']}\n\n")
    
    f.write("\n\nMATCHES SIMILARES\n" + "="*80 + "\n")
    for m in matches_similar:
        f.write(f"[{m['codigo']}] {m['nome_csv']} ({m['similaridade']}%)\n")
        f.write(f"  → {m['nome_banco']}\n\n")
    
    f.write("\n\nNÃO ENCONTRADOS\n" + "="*80 + "\n")
    for f_nao in nao_encontrados:
        f.write(f"[{f_nao['codigo']}] {f_nao['nome']}\n")

print("✅ Relatório: relatorio-completo.txt")
print("\n" + "="*80)
