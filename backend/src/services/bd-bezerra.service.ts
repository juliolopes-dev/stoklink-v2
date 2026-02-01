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

export interface PedidoDRP {
  id: number
  numero_pedido: string
  numero_nf_origem: string
  cod_filial_destino: string
  nome_filial_destino: string | null
  data_pedido: Date | null
  status: string | null
  usuario: string | null
  observacao: string | null
  total_itens: number | null
  total_quantidade: number | null
  created_at: Date | null
  updated_at: Date | null
  itens?: PedidoDRPItem[]
}

export interface PedidoDRPItem {
  id: number
  pedido_id: number
  cod_produto: string
  descricao_produto: string | null
  quantidade: number
  tipo_calculo: string | null
  necessidade_original: number | null
  estoque_filial: number | null
  created_at: Date | null
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

  /**
   * Busca todos os Pedidos DRP com filtros opcionais
   */
  async listarPedidosDRP(filtros?: {
    status?: string
    codFilialDestino?: string
    dataInicio?: string
    dataFim?: string
    numeroPedido?: string
  }): Promise<PedidoDRP[]> {
    console.log('📦 BD-BEZERRA: Buscando Pedidos DRP')
    const client = await pool.connect()
    
    try {
      let query = `
        SELECT 
          id,
          numero_pedido,
          numero_nf_origem,
          cod_filial_destino,
          nome_filial_destino,
          data_pedido,
          status,
          usuario,
          observacao,
          total_itens,
          total_quantidade,
          created_at,
          updated_at
        FROM auditoria_integracao."Pedido_DRP"
        WHERE 1=1
      `
      const params: (string | Date)[] = []
      let paramIndex = 1

      if (filtros?.status) {
        query += ` AND status = $${paramIndex}`
        params.push(filtros.status)
        paramIndex++
      }

      if (filtros?.codFilialDestino) {
        query += ` AND cod_filial_destino = $${paramIndex}`
        params.push(filtros.codFilialDestino)
        paramIndex++
      }

      if (filtros?.dataInicio) {
        query += ` AND data_pedido >= $${paramIndex}`
        params.push(filtros.dataInicio)
        paramIndex++
      }

      if (filtros?.dataFim) {
        query += ` AND data_pedido <= $${paramIndex}`
        params.push(filtros.dataFim)
        paramIndex++
      }

      if (filtros?.numeroPedido) {
        query += ` AND numero_pedido ILIKE $${paramIndex}`
        params.push(`%${filtros.numeroPedido}%`)
        paramIndex++
      }

      query += ` ORDER BY data_pedido DESC, id DESC`
      
      const result = await client.query(query, params)
      
      return result.rows.map(row => ({
        id: row.id,
        numero_pedido: row.numero_pedido,
        numero_nf_origem: row.numero_nf_origem,
        cod_filial_destino: row.cod_filial_destino,
        nome_filial_destino: row.nome_filial_destino,
        data_pedido: row.data_pedido,
        status: row.status,
        usuario: row.usuario,
        observacao: row.observacao,
        total_itens: row.total_itens,
        total_quantidade: row.total_quantidade ? parseFloat(row.total_quantidade) : null,
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Busca um Pedido DRP por ID com seus itens
   */
  async buscarPedidoDRPPorId(id: number): Promise<PedidoDRP | null> {
    console.log(`📦 BD-BEZERRA: Buscando Pedido DRP #${id}`)
    const client = await pool.connect()
    
    try {
      const pedidoQuery = `
        SELECT 
          id,
          numero_pedido,
          numero_nf_origem,
          cod_filial_destino,
          nome_filial_destino,
          data_pedido,
          status,
          usuario,
          observacao,
          total_itens,
          total_quantidade,
          created_at,
          updated_at
        FROM auditoria_integracao."Pedido_DRP"
        WHERE id = $1
      `
      
      const pedidoResult = await client.query(pedidoQuery, [id])
      
      if (pedidoResult.rows.length === 0) {
        return null
      }

      const row = pedidoResult.rows[0]
      
      const itensQuery = `
        SELECT 
          id,
          pedido_id,
          cod_produto,
          descricao_produto,
          quantidade,
          tipo_calculo,
          necessidade_original,
          estoque_filial,
          created_at
        FROM auditoria_integracao."Pedido_DRP_Itens"
        WHERE pedido_id = $1
        ORDER BY id
      `
      
      const itensResult = await client.query(itensQuery, [id])
      
      return {
        id: row.id,
        numero_pedido: row.numero_pedido,
        numero_nf_origem: row.numero_nf_origem,
        cod_filial_destino: row.cod_filial_destino,
        nome_filial_destino: row.nome_filial_destino,
        data_pedido: row.data_pedido,
        status: row.status,
        usuario: row.usuario,
        observacao: row.observacao,
        total_itens: row.total_itens,
        total_quantidade: row.total_quantidade ? parseFloat(row.total_quantidade) : null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        itens: itensResult.rows.map(item => ({
          id: item.id,
          pedido_id: item.pedido_id,
          cod_produto: item.cod_produto,
          descricao_produto: item.descricao_produto,
          quantidade: parseFloat(item.quantidade) || 0,
          tipo_calculo: item.tipo_calculo,
          necessidade_original: item.necessidade_original ? parseFloat(item.necessidade_original) : null,
          estoque_filial: item.estoque_filial ? parseFloat(item.estoque_filial) : null,
          created_at: item.created_at
        }))
      }
    } finally {
      client.release()
    }
  }

  /**
   * Busca estatísticas dos Pedidos DRP
   */
  async estatisticasPedidosDRP(): Promise<{
    total: number
    porStatus: { status: string; quantidade: number }[]
    porFilial: { filial: string; nome: string; quantidade: number }[]
  }> {
    console.log('📊 BD-BEZERRA: Buscando estatísticas de Pedidos DRP')
    const client = await pool.connect()
    
    try {
      const totalQuery = `SELECT COUNT(*) as total FROM auditoria_integracao."Pedido_DRP"`
      const totalResult = await client.query(totalQuery)
      
      const porStatusQuery = `
        SELECT status, COUNT(*) as quantidade 
        FROM auditoria_integracao."Pedido_DRP" 
        GROUP BY status 
        ORDER BY quantidade DESC
      `
      const porStatusResult = await client.query(porStatusQuery)
      
      const porFilialQuery = `
        SELECT cod_filial_destino as filial, nome_filial_destino as nome, COUNT(*) as quantidade 
        FROM auditoria_integracao."Pedido_DRP" 
        GROUP BY cod_filial_destino, nome_filial_destino 
        ORDER BY quantidade DESC
      `
      const porFilialResult = await client.query(porFilialQuery)
      
      return {
        total: parseInt(totalResult.rows[0]?.total || '0'),
        porStatus: porStatusResult.rows.map(r => ({
          status: r.status || 'Sem status',
          quantidade: parseInt(r.quantidade)
        })),
        porFilial: porFilialResult.rows.map(r => ({
          filial: r.filial,
          nome: r.nome || r.filial,
          quantidade: parseInt(r.quantidade)
        }))
      }
    } finally {
      client.release()
    }
  }
}

export const bdBezerraService = new BdBezerraService()
