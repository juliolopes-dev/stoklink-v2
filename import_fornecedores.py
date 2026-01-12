import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import uuid
import re

# Configuração do banco
DB_CONFIG = {
    'host': '147.93.144.135',
    'port': 4154,
    'database': 'stoklink-v2',
    'user': 'postgres',
    'password': 'eca7acf5875ea693addb'
}

def normalizar_cnpj(cnpj):
    """Remove caracteres não numéricos do CNPJ"""
    if pd.isna(cnpj):
        return None
    # Converte para string e remove tudo que não é dígito
    cnpj_str = str(int(cnpj)) if isinstance(cnpj, float) else str(cnpj)
    return re.sub(r'[^\d]', '', cnpj_str)

def main():
    print("=" * 60)
    print("IMPORTAÇÃO DE FORNECEDORES")
    print("=" * 60)
    
    # 1. Ler o Excel
    print("\n1. Lendo arquivo Excel...")
    df = pd.read_excel('lista_fornecedores.xlsx')
    print(f"   ✓ {len(df)} fornecedores encontrados")
    
    # 2. Conectar ao banco
    print("\n2. Conectando ao banco de dados...")
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("   ✓ Conectado com sucesso")
    
    # 3. Buscar empresa_id
    print("\n3. Buscando empresa no banco...")
    cursor.execute("SELECT id, razao_social, nome_fantasia FROM empresas LIMIT 1")
    empresa = cursor.fetchone()
    
    if not empresa:
        print("   ✗ ERRO: Nenhuma empresa encontrada no banco!")
        conn.close()
        return
    
    empresa_id = empresa[0]
    empresa_nome = empresa[2] if empresa[2] else empresa[1]
    print(f"   ✓ Empresa encontrada: {empresa_nome} (ID: {empresa_id})")
    
    # 4. Verificar fornecedores existentes
    print("\n4. Verificando fornecedores existentes...")
    cursor.execute("SELECT COUNT(*) FROM fornecedores WHERE empresa_id = %s", (empresa_id,))
    count_existentes = cursor.fetchone()[0]
    print(f"   ℹ {count_existentes} fornecedores já cadastrados")
    
    # 5. Preparar dados para importação
    print("\n5. Preparando dados para importação...")
    fornecedores_novos = []
    cnpjs_existentes = set()
    
    # Buscar CNPJs já cadastrados
    cursor.execute("SELECT cnpj FROM fornecedores WHERE empresa_id = %s AND cnpj IS NOT NULL", (empresa_id,))
    for row in cursor.fetchall():
        cnpjs_existentes.add(row[0])
    
    duplicados = 0
    cnpj_invalidos = 0
    
    for _, row in df.iterrows():
        nome = str(row['NOME']).strip()
        cnpj = normalizar_cnpj(row['CNPJ'])
        
        # Validar
        if not nome or nome == 'nan':
            continue
            
        if not cnpj or len(cnpj) != 14:
            cnpj_invalidos += 1
            cnpj = None  # Permitir cadastro sem CNPJ
        
        # Verificar duplicação por CNPJ
        if cnpj and cnpj in cnpjs_existentes:
            duplicados += 1
            continue
        
        # Adicionar à lista
        fornecedor_id = str(uuid.uuid4())
        fornecedores_novos.append((
            fornecedor_id,
            empresa_id,
            nome,
            cnpj,
            True  # ativo
        ))
        
        if cnpj:
            cnpjs_existentes.add(cnpj)
    
    print(f"   ✓ {len(fornecedores_novos)} novos fornecedores para importar")
    print(f"   ℹ {duplicados} duplicados (ignorados)")
    print(f"   ⚠ {cnpj_invalidos} CNPJs inválidos (cadastrados sem CNPJ)")
    
    # 6. Importar dados
    if len(fornecedores_novos) == 0:
        print("\n⚠ Nenhum fornecedor novo para importar!")
        conn.close()
        return
    
    print(f"\n6. Importando {len(fornecedores_novos)} fornecedores...")
    
    try:
        execute_values(
            cursor,
            """
            INSERT INTO fornecedores (id, empresa_id, nome, cnpj, ativo, created_at, updated_at)
            VALUES %s
            """,
            [(f[0], f[1], f[2], f[3], f[4], 'NOW()', 'NOW()') for f in fornecedores_novos],
            page_size=100
        )
        
        conn.commit()
        print("   ✓ Importação concluída com sucesso!")
        
    except Exception as e:
        conn.rollback()
        print(f"   ✗ ERRO na importação: {e}")
        conn.close()
        return
    
    # 7. Verificar resultado final
    print("\n7. Verificando resultado...")
    cursor.execute("SELECT COUNT(*) FROM fornecedores WHERE empresa_id = %s", (empresa_id,))
    count_final = cursor.fetchone()[0]
    print(f"   ✓ Total de fornecedores agora: {count_final}")
    print(f"   ✓ Novos cadastrados: {count_final - count_existentes}")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("IMPORTAÇÃO FINALIZADA COM SUCESSO!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n✗ ERRO FATAL: {e}")
        import traceback
        traceback.print_exc()
