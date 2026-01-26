import csv

# Fornecedores sem código no banco
fornecedores_sem_codigo = [
    {"nome": "AUTO PECAS PADRE CICERO LTDA", "cnpj": None},
    {"nome": "AUTO PECAS PADRE CICERO LTDA", "cnpj": "7965809003201"},
    {"nome": "BRAZMAX  COMERCIO  DE  PRODUTOS AUTOMOTIVOS LTDA", "cnpj": "4208093000103"},
    {"nome": "CONNECT SA", "cnpj": None},
    {"nome": "FRANCINALDO FERREIRA DE ARAUJO", "cnpj": None},
    {"nome": "JERONYMO DIX-NEUF PECAS E SERVICOS LTDA", "cnpj": None},
    {"nome": "MARIA GORETTE C SILVA EIRELI", "cnpj": None},
    {"nome": "MHT IND. COM. DE COMP. AUTOM. LTDA", "cnpj": None},
    {"nome": "MTF COMERCIO DE ROLAMENTOS LTDA", "cnpj": None},
    {"nome": "ORBI QUIMICA S/A", "cnpj": None},
    {"nome": "RKG AUTOMOTIVA LTDA", "cnpj": "1356623000164"},
    {"nome": "SOARES GONCALVES COMERCIO E SERVICOS LTD", "cnpj": None},
    {"nome": "SOLOPES INDUSTRIA E COMERCIO DE PECAS AUTOMOTIVAS LTDA", "cnpj": "5619430000100"},
    {"nome": "UNIVERSAL AUTOMOTIVE SYSTEMS S/A", "cnpj": None},
    {"nome": "VIRTUAL PLASTICOS LTDA - EPP", "cnpj": "2601566000102"},
    {"nome": "yteste2", "cnpj": "4587878545"}
]

def normalizar_cnpj(cnpj):
    if not cnpj:
        return None
    return ''.join(filter(str.isdigit, str(cnpj)))

def normalizar_nome(nome):
    return nome.upper().strip()

# Ler CSV
print("Lendo CSV...")
fornecedores_csv = []
with open('dados-bezerra._public_._dim_fornecedor_.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        fornecedores_csv.append({
            'codigo': row['codfornec'],
            'nome': normalizar_nome(row['nome']),
            'cnpj': normalizar_cnpj(row['cgccpf'])
        })

print(f"Total no CSV: {len(fornecedores_csv)}")

# Verificar cada fornecedor
print("\n" + "="*80)
print("VERIFICAÇÃO")
print("="*80)

encontrados = []
nao_encontrados = []

for forn in fornecedores_sem_codigo:
    nome_normalizado = normalizar_nome(forn['nome'])
    cnpj_normalizado = normalizar_cnpj(forn['cnpj'])
    
    encontrado = False
    match_info = None
    
    # Tentar por CNPJ
    if cnpj_normalizado:
        for csv_forn in fornecedores_csv:
            if csv_forn['cnpj'] == cnpj_normalizado:
                encontrado = True
                match_info = {
                    'tipo': 'CNPJ',
                    'codigo': csv_forn['codigo'],
                    'nome_csv': csv_forn['nome']
                }
                break
    
    # Tentar por nome
    if not encontrado:
        for csv_forn in fornecedores_csv:
            if csv_forn['nome'] == nome_normalizado:
                encontrado = True
                match_info = {
                    'tipo': 'NOME',
                    'codigo': csv_forn['codigo'],
                    'nome_csv': csv_forn['nome']
                }
                break
    
    if encontrado:
        encontrados.append({
            'nome': forn['nome'],
            'cnpj': forn['cnpj'],
            'match': match_info
        })
        print(f"✅ {forn['nome']}")
        print(f"   → Encontrado no CSV: [{match_info['codigo']}] {match_info['nome_csv']}")
        print(f"   → Match por: {match_info['tipo']}")
        print()
    else:
        nao_encontrados.append(forn)
        print(f"❌ {forn['nome']}")
        if forn['cnpj']:
            print(f"   CNPJ: {forn['cnpj']}")
        print(f"   → NÃO encontrado no CSV")
        print()

print("="*80)
print("RESUMO")
print("="*80)
print(f"✅ Encontrados no CSV: {len(encontrados)}")
print(f"❌ NÃO encontrados no CSV: {len(nao_encontrados)}")

if len(encontrados) > 0:
    print("\n" + "="*80)
    print("FORNECEDORES QUE ESTÃO NO CSV MAS SEM CÓDIGO NO BANCO")
    print("="*80)
    for f in encontrados:
        print(f"[{f['match']['codigo']}] {f['nome']}")
        if f['cnpj']:
            print(f"  CNPJ: {f['cnpj']}")
