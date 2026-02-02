import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { bdBezerraService } from '../services/bd-bezerra.service'
import { authMiddleware } from '../middlewares/auth'

export async function pedidoDrpRoutes(app: FastifyInstance) {
  // Listar todos os Pedidos DRP
  app.get('/pedidos-drp', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const querySchema = z.object({
        status: z.string().optional(),
        codFilialDestino: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        numeroPedido: z.string().optional()
      })

      const filtros = querySchema.parse(request.query)
      
      const pedidos = await bdBezerraService.listarPedidosDRP(filtros)
      
      return reply.send(pedidos)
    } catch (error) {
      console.error('Erro ao listar Pedidos DRP:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao listar Pedidos DRP' })
    }
  })

  // Excluir Pedido DRP
  app.delete('/pedidos-drp/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.coerce.number().int().positive()
      })

      const { id } = paramsSchema.parse(request.params)

      await bdBezerraService.excluirPedidoDRP(id)

      return reply.send({ success: true })
    } catch (error) {
      console.error('Erro ao excluir Pedido DRP:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ success: false, error: error.message })
      }
      return reply.status(500).send({ success: false, error: 'Erro ao excluir Pedido DRP' })
    }
  })

  // Buscar Pedido DRP por ID com itens
  app.get('/pedidos-drp/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.coerce.number().int().positive()
      })

      const { id } = paramsSchema.parse(request.params)
      
      const pedido = await bdBezerraService.buscarPedidoDRPPorId(id)
      
      if (!pedido) {
        return reply.status(404).send({ error: 'Pedido DRP não encontrado' })
      }
      
      return reply.send(pedido)
    } catch (error) {
      console.error('Erro ao buscar Pedido DRP:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar Pedido DRP' })
    }
  })

  // Atualizar Pedido DRP (status e/ou número de transferência)
  app.put('/pedidos-drp/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.coerce.number().int().positive()
      })

      const bodySchema = z.object({
        status: z.string().optional(),
        numero_transferencia: z.string().optional()
      })

      const { id } = paramsSchema.parse(request.params)
      const dados = bodySchema.parse(request.body)

      if (!dados.status && !dados.numero_transferencia) {
        return reply.status(400).send({ error: 'Informe ao menos um campo para atualizar' })
      }

      const pedidoAtualizado = await bdBezerraService.atualizarPedidoDRP(id, dados)
      
      return reply.send(pedidoAtualizado)
    } catch (error) {
      console.error('Erro ao atualizar Pedido DRP:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar Pedido DRP' })
    }
  })

  // Estatísticas dos Pedidos DRP
  app.get('/pedidos-drp/estatisticas', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const estatisticas = await bdBezerraService.estatisticasPedidosDRP()
      
      return reply.send(estatisticas)
    } catch (error) {
      console.error('Erro ao buscar estatísticas de Pedidos DRP:', error)
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar estatísticas' })
    }
  })
}
