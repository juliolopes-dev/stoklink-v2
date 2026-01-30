import { Pool } from 'pg'

/**
 * Serviço para conectar ao banco de dados BD-BEZERRA
 * e buscar itens de NF secundária
 */

const pool = new Pool({
  host: '95.111.255.122',
  port: 4214,
  database: 'banco-dados-bezerra',
  user: 'postgres',
  password: 'd2c0655c520bab6ccea5',
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
})

export interface ItemNfBezerra {
  cod_produto: string
  descricao: string
  quantidade: number
}

class BdBezerraService {
  /**
   * Busca itens de uma NF pelo número da nota no banco BD-BEZERRA
   * @param numeroNota - Número da nota fiscal secundária
   * @param codFilial - Código da filial (00=Petrolina, 01=Juazeiro, 02=Salgueiro, 05=Bonfim, 06=Picos)
   */
  async buscarItensNf(numeroNota: string, codFilial: string): Promise<ItemNfBezerra[]> {
    console.log(`🔎 BD-BEZERRA: Buscando NF ${numeroNota} na filial ${codFilial}`)
    const client = await pool.connect()
    
    try {
      const query = `
        SELECT 
          nf.cod_produto,
          COALESCE(p.descricao, 'Produto não encontrado') as descricao,
          nf.quantidade::numeric as quantidade
        FROM auditoria_integracao.auditoria_nf_entrada_juazeiro nf
        LEFT JOIN auditoria_integracao.auditoria_produtos_drp p 
          ON nf.cod_produto = p.cod_produto
        WHERE nf.numero_nota = $1
          AND nf.cod_filial = $2
        ORDER BY nf.id
      `
      
      const result = await client.query(query, [numeroNota, codFilial])
      
      return result.rows.map(row => ({
        cod_produto: row.cod_produto,
        descricao: row.descricao,
        quantidade: parseFloat(row.quantidade) || 0
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Testa a conexão com o banco BD-BEZERRA
   */
  async testarConexao(): Promise<boolean> {
    const client = await pool.connect()
    
    try {
      await client.query('SELECT 1')
      return true
    } catch (error) {
      console.error('Erro ao conectar ao BD-BEZERRA:', error)
      return false
    } finally {
      client.release()
    }
  }
}

export const bdBezerraService = new BdBezerraService()
