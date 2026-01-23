import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { NotaFiscalService } from '../services/nota-fiscal.service.js'
import { authMiddleware } from '../middlewares/auth.js'
import { webhookService } from '../services/webhook.service.js'
import { parseTxtSecundario, validarTxtSecundario } from '../utils/txtParser.js'
import { prisma } from '../lib/prisma.js'
import path from 'path'
import fs from 'fs'

const notaFiscalService = new NotaFiscalService()

const importarXmlSchema = z.object({
  filialDestinoId: z.string().uuid('ID da filial de destino inválido'),
  tipoMovimentacao: z.enum(['NORMAL', 'DISTRIBUICAO_IMEDIATA']),
  quantidadeVolumes: z.coerce.number().int().positive().optional(),
  observacoes: z.string().optional(),
  numeroSecundario: z.string().optional(),
  fornecedorSecundarioId: z.string().uuid('ID do fornecedor secundário inválido').optional().or(z.literal(''))
})

const createNotaFiscalSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  serie: z.string().optional(),
  chaveAcesso: z.string().optional(),
  fornecedorNome: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  fornecedorCnpj: z.string().optional(),
  dataEmissao: z.coerce.date().optional(),
  valorTotal: z.coerce.number().optional(),
  quantidadeVolumes: z.coerce.number().int().positive(),
  tipoMovimentacao: z.enum(['NORMAL', 'DISTRIBUICAO_IMEDIATA']),
  filialDestinoId: z.string().uuid('ID da filial de destino inválido'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    codigoProduto: z.string().min(1),
    descricao: z.string().min(1),
    ncm: z.string().optional(),
    unidade: z.string().min(1),
    quantidadeNota: z.coerce.number().positive(),
    valorUnitario: z.coerce.number().optional(),
    valorTotal: z.coerce.number().optional()
  })).min(1, 'É obrigatório incluir pelo menos um item na nota fiscal')
})

const listFiltersSchema = z.object({
  status: z.enum([
    'PENDENTE_TRANSFERENCIA',
    'VOLUMES_CONFERIDOS',
    'VOLUMES_DIVERGENTES',
    'AGUARDANDO_CONFERENCIA_DESTINO',
    'EM_CONFERENCIA',
    'CONFERIDO_OK',
    'CONFERIDO_DIVERGENCIA',
    'BLOQUEADO'
  ]).optional(),
  filialRecebimentoId: z.string().uuid().optional(),
  filialDestinoId: z.string().uuid().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  dataEmissao: z.string().optional(),
  searchTerm: z.string().optional(),
  entradaRp: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  mercadoriaBloqueada: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function notaFiscalRoutes(app: FastifyInstance) {
  // Importar XML de NF-extrai dados sem salvar)
  app.post('/notas-fiscais/preview-xml', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'Arquivo XML é obrigatório' })
      }

      const xmlBuffer = await data.toBuffer()
      const xmlContent = xmlBuffer.toString('utf-8')

      const preview = await notaFiscalService.previewXml(xmlContent)
      return reply.send(preview)
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao processar XML' })
    }
  })

  // Importar XML
  app.post('/notas-fiscais/importar-xml', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const parts = request.parts()
      let xmlContent = ''
      let danfFile: { filename: string; buffer: Buffer } | null = null
      let txtFile: { filename: string; buffer: Buffer } | null = null
      const fields: Record<string, string> = {}

      // Processar todas as partes do multipart
      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()
          if (part.fieldname === 'file') {
            xmlContent = buffer.toString('utf-8')
          } else if (part.fieldname === 'danfFile') {
            danfFile = {
              filename: part.filename,
              buffer
            }
          } else if (part.fieldname === 'txtFile') {
            txtFile = {
              filename: part.filename,
              buffer
            }
          }
        } else {
          fields[part.fieldname] = part.value as string
        }
      }
      
      if (!xmlContent) {
        return reply.status(400).send({ error: 'Arquivo XML é obrigatório' })
      }
      
      const params = importarXmlSchema.parse(fields)

      const notaFiscal = await notaFiscalService.importarXml({
        empresaId: request.user.empresaId,
        xmlContent,
        filialDestinoId: params.filialDestinoId,
        tipoMovimentacao: params.tipoMovimentacao,
        usuarioId: request.user.id,
        quantidadeVolumes: params.quantidadeVolumes,
        observacoes: params.observacoes,
        numeroSecundario: params.numeroSecundario || undefined,
        fornecedorSecundarioId: params.fornecedorSecundarioId || undefined
      })

      // Se houver arquivo DANF, fazer upload
      if (danfFile && notaFiscal.id) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'danf-secundarios')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        const uniqueFilename = `${notaFiscal.id}-${Date.now()}.pdf`
        const filePath = path.join(uploadDir, uniqueFilename)
        
        fs.writeFileSync(filePath, danfFile.buffer)

        // Atualizar NF com caminho do DANF
        await notaFiscalService.update(notaFiscal.id, {
          danfSecundario: `uploads/danf-secundarios/${uniqueFilename}`
        })
      }

      // Se houver arquivo TXT de itens secundários, processar e salvar
      if (txtFile && notaFiscal.id) {
        console.log(`📄 Processando arquivo TXT: ${txtFile.filename}`)
        const txtContent = txtFile.buffer.toString('latin1') // Encoding para arquivos Windows
        console.log(`📝 Tamanho do conteúdo: ${txtContent.length} caracteres`)
        
        // Validar TXT
        const validacao = validarTxtSecundario(txtContent)
        console.log(`✅ Validação do TXT:`, validacao)
        if (!validacao.valido) {
          console.warn(`⚠️ TXT inválido: ${validacao.erro}`)
        } else {
          // Parsear itens do TXT
          const itensSecundarios = parseTxtSecundario(txtContent)
          console.log(`📦 Itens encontrados no TXT: ${itensSecundarios.length}`)
          
          if (itensSecundarios.length > 0) {
            // Salvar TXT no disco
            const uploadDir = path.join(process.cwd(), 'uploads', 'txt-secundarios')
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }

            const uniqueFilename = `${notaFiscal.id}-${Date.now()}.txt`
            const filePath = path.join(uploadDir, uniqueFilename)
            fs.writeFileSync(filePath, txtFile.buffer)

            // Salvar itens no banco de dados
            await prisma.itemNfSecundaria.createMany({
              data: itensSecundarios.map(item => ({
                notaFiscalId: notaFiscal.id,
                codigo: item.codigo,
                descricao: item.descricao,
                quantidade: item.quantidade
              }))
            })

            // Atualizar NF com caminho do TXT
            await notaFiscalService.update(notaFiscal.id, {
              txtSecundario: `uploads/txt-secundarios/${uniqueFilename}`
            })

            console.log(`✅ ${itensSecundarios.length} itens secundários importados do TXT`)
          }
        }
      }

      // Enviar webhook para n8n
      await webhookService.notaFiscalCriada(
        notaFiscal.id,
        { origem: 'importacao_xml' },
        request.user.id
      )

      return reply.status(201).send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao importar XML' })
    }
  })

  // Criar manualmente
  app.post('/notas-fiscais', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = createNotaFiscalSchema.parse(request.body)

      const notaFiscal = await notaFiscalService.create({
        ...data,
        empresaId: request.user.empresaId,
        usuarioId: request.user.id
      })

      // Enviar webhook para n8n
      await webhookService.notaFiscalCriada(
        notaFiscal.id,
        { origem: 'cadastro_manual' },
        request.user.id
      )

      return reply.status(201).send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar nota fiscal' })
    }
  })

  // Listar todas
  app.get('/notas-fiscais', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const filters = listFiltersSchema.parse(request.query)
      const notasFiscais = await notaFiscalService.findAll(filters)
      return reply.send(notasFiscais)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar notas fiscais' })
    }
  })

  // Buscar por ID
  app.get('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const notaFiscal = await notaFiscalService.findById(id)
      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar nota fiscal' })
    }
  })

  // Editar NF (segundo fornecedor, número secundário, observações)
  app.put('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      
      const bodySchema = z.object({
        numero: z.string().optional().nullable(),
        numeroSecundario: z.string().optional().nullable(),
        fornecedorSecundarioId: z.string().uuid().optional().nullable(),
        filialRecebimentoId: z.string().uuid().optional().nullable(),
        filialDestinoId: z.string().uuid().optional().nullable(),
        tipoMovimentacao: z.enum(['NORMAL', 'DISTRIBUICAO_IMEDIATA']).optional().nullable(),
        transportadora: z.string().optional().nullable(),
        observacoes: z.string().optional().nullable(),
        entradaRp: z.boolean().optional().nullable()
      })

      const body = bodySchema.parse(request.body)
      
      // Preparar dados para atualização
      const data: Record<string, unknown> = {}
      
      if (body.numero !== undefined) data.numero = body.numero || null
      if (body.numeroSecundario !== undefined) data.numeroSecundario = body.numeroSecundario || null
      if (body.fornecedorSecundarioId !== undefined) data.fornecedorSecundarioId = body.fornecedorSecundarioId
      if (body.filialRecebimentoId !== undefined) data.filialRecebimentoId = body.filialRecebimentoId
      if (body.filialDestinoId !== undefined) data.filialDestinoId = body.filialDestinoId
      if (body.tipoMovimentacao !== undefined) data.tipoMovimentacao = body.tipoMovimentacao
      if (body.transportadora !== undefined) data.transportadora = body.transportadora || null
      if (body.observacoes !== undefined) data.observacoes = body.observacoes || null
      if (body.entradaRp !== undefined) data.entradaRp = body.entradaRp
      
      const notaFiscal = await notaFiscalService.update(id, data)

      // Enviar webhook para n8n
      await webhookService.notaFiscalAlterada(
        id,
        { alteracoes: Object.keys(data) },
        request.user.id
      )

      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar nota fiscal' })
    }
  })

  // Excluir NF (apenas ADMIN e COMPRAS)
  app.delete('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      // Verificar se é ADMIN ou COMPRAS
      if (request.user.perfil !== 'ADMIN' && request.user.perfil !== 'COMPRAS') {
        return reply.status(403).send({ error: 'Apenas administradores e setor de compras podem excluir notas fiscais' })
      }

      const { id } = idParamSchema.parse(request.params)
      
      // Enviar webhook ANTES de excluir para garantir que os dados existam
      await webhookService.notaFiscalExcluida(
        id,
        {},
        request.user.id
      )

      await notaFiscalService.delete(id)

      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao excluir nota fiscal' })
    }
  })

  // Liberar/Bloquear mercadoria
  app.patch('/notas-fiscais/:id/mercadoria-bloqueada', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const usuarioId = (request as any).user?.id
      
      const bodySchema = z.object({
        bloqueada: z.boolean()
      })
      const { bloqueada } = bodySchema.parse(request.body)
      
      const notaFiscal = await notaFiscalService.toggleBloqueioMercadoria(id, bloqueada, usuarioId)
      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao alterar bloqueio da mercadoria' })
    }
  })

  // Conferir todos os itens de uma vez
  app.post('/notas-fiscais/:id/itens/conferir-todos', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      
      const bodySchema = z.object({
        quantidades: z.record(z.string(), z.coerce.number().min(0))
      })
      const { quantidades } = bodySchema.parse(request.body)
      
      const result = await notaFiscalService.conferirTodosItens(id, quantidades)
      return reply.send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao conferir itens' })
    }
  })

  // Conferir item individual
  app.post('/notas-fiscais/:id/itens/:itemId/conferir', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid()
      })
      const { id, itemId } = paramsSchema.parse(request.params)
      
      const bodySchema = z.object({
        quantidadeConferida: z.coerce.number().min(0)
      })
      const { quantidadeConferida } = bodySchema.parse(request.body)
      
      const item = await notaFiscalService.conferirItem(id, itemId, quantidadeConferida, request.user.id)
      return reply.send(item)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao conferir item' })
    }
  })

  // Relatório por filial de recebimento
  app.get('/notas-fiscais/relatorio/filial/:filialId', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        filialId: z.string().uuid()
      })
      const { filialId } = paramsSchema.parse(request.params)
      const notas = await notaFiscalService.getByFilialRecebimento(filialId)
      return reply.send(notas)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar relatório' })
    }
  })

  // Estatísticas avançadas
  app.get('/notas-fiscais/estatisticas/avancadas', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const stats = await notaFiscalService.getEstatisticasAvancadas()
      return reply.send(stats)
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar estatísticas' })
    }
  })

  // Upload de DANF secundário
  app.post('/notas-fiscais/:id/upload-danf-secundario', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
      
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
      }

      // Validar tipo de arquivo
      if (data.mimetype !== 'application/pdf') {
        return reply.status(400).send({ error: 'Apenas arquivos PDF são permitidos' })
      }

      // Validar tamanho (10MB)
      const buffer = await data.toBuffer()
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Arquivo muito grande. Máximo 10MB' })
      }

      // Criar diretório se não existir
      const uploadsDir = path.join(__dirname, '../../uploads/danf-secundarios')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Gerar nome único do arquivo
      const timestamp = Date.now()
      const filename = `${id}-${timestamp}.pdf`
      const filepath = path.join(uploadsDir, filename)

      // Salvar arquivo
      fs.writeFileSync(filepath, buffer)

      // Atualizar banco de dados
      const relativePath = `uploads/danf-secundarios/${filename}`
      await notaFiscalService.update(id, { danfSecundario: relativePath })

      return reply.send({ 
        message: 'DANF secundário enviado com sucesso',
        path: relativePath 
      })
    } catch (error) {
      console.error('Erro ao fazer upload do DANF:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao fazer upload do DANF' })
    }
  })

  // Servir arquivo DANF secundário
  app.get('/uploads/danf-secundarios/:filename', async (request, reply) => {
    try {
      const { filename } = z.object({ filename: z.string() }).parse(request.params)
      
      const filepath = path.join(__dirname, '../../uploads/danf-secundarios', filename)
      
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({ error: 'Arquivo não encontrado' })
      }

      const stream = fs.createReadStream(filepath)
      reply.type('application/pdf')
      return reply.send(stream)
    } catch (error) {
      console.error('Erro ao servir DANF:', error)
      return reply.status(500).send({ error: 'Erro ao carregar arquivo' })
    }
  })

  // Deletar DANF secundário
  app.delete('/notas-fiscais/:id/danf-secundario', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
      
      // Buscar NF para pegar caminho do arquivo
      const nf = await notaFiscalService.findById(id)
      
      if (nf.danfSecundario) {
        const filepath = path.join(__dirname, '../..', nf.danfSecundario)
        
        // Deletar arquivo se existir
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath)
        }
      }

      // Atualizar banco removendo referência
      await notaFiscalService.update(id, { danfSecundario: null })

      return reply.send({ message: 'DANF secundário removido com sucesso' })
    } catch (error) {
      console.error('Erro ao deletar DANF:', error)
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao deletar DANF' })
    }
  })
}
