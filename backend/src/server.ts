// Configurar timezone para America/Sao_Paulo (UTC-3)
process.env.TZ = 'America/Sao_Paulo'

// Versão da aplicação - incrementar a cada deploy
const APP_VERSION = '1.0.9'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { authRoutes } from './routes/auth.routes.js'
import { filialRoutes } from './routes/filial.routes.js'
import { usuarioRoutes } from './routes/usuario.routes.js'
import { notaFiscalRoutes } from './routes/nota-fiscal.routes.js'
import { conferenciaRoutes } from './routes/conferencia.routes.js'
import { divergenciaRoutes } from './routes/divergencia.routes.js'
import { distribuicaoRoutes } from './routes/distribuicao.routes.js'
import { fornecedorRoutes } from './routes/fornecedor.routes.js'
import { empresaRoutes } from './routes/empresa.routes.js'

const app = Fastify({
  logger: false,
  disableRequestLogging: true
})

// Plugins
app.register(cors, {
  origin: true,
  exposedHeaders: ['X-App-Version']
})

app.register(jwt, {
  secret: env.JWT_SECRET
})

// Hook para adicionar header de versão em todas as respostas da API
app.addHook('onSend', (request, reply, payload, done) => {
  if (request.url.startsWith('/api')) {
    reply.header('X-App-Version', APP_VERSION)
  }
  done(null, payload)
})

// Hook para logar todas as requisições
app.addHook('onResponse', (request, reply, done) => {
  const responseTime = reply.elapsedTime
  const userId = (request.user as { id?: string })?.id
  
  // Não logar requisições de arquivos estáticos
  if (!request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    logger.request(
      request.method,
      request.url,
      reply.statusCode,
      responseTime,
      userId
    )
  }
  done()
})

// Hook para logar erros
app.addHook('onError', (request, reply, error, done) => {
  logger.error(`Erro na requisição ${request.method} ${request.url}`, error)
  done()
})

// Routes - todas com prefixo /api
app.register(authRoutes, { prefix: '/api' })
app.register(filialRoutes, { prefix: '/api' })
app.register(usuarioRoutes, { prefix: '/api' })
app.register(notaFiscalRoutes, { prefix: '/api' })
app.register(conferenciaRoutes, { prefix: '/api' })
app.register(divergenciaRoutes, { prefix: '/api' })
app.register(distribuicaoRoutes, { prefix: '/api' })
app.register(fornecedorRoutes, { prefix: '/api' })
app.register(empresaRoutes, { prefix: '/api' })

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Servir frontend estático em produção
if (env.NODE_ENV === 'production') {
  const publicPath = path.join(process.cwd(), 'public')
  
  app.register(fastifyStatic, {
    root: publicPath,
    prefix: '/'
  })

  // SPA fallback - todas as rotas não-API retornam index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (!request.url.startsWith('/api') && !request.url.startsWith('/health')) {
      return reply.sendFile('index.html')
    }
    return reply.code(404).send({ error: 'Not Found' })
  })
}

// Start server
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    logger.startup(env.PORT, env.NODE_ENV)
    logger.info('Rotas registradas:', {
      auth: '/api/auth/*',
      filiais: '/api/filiais/*',
      usuarios: '/api/usuarios/*',
      notasFiscais: '/api/notas-fiscais/*',
      conferencias: '/api/conferencias/*',
      divergencias: '/api/divergencias/*',
      distribuicoes: '/api/distribuicoes/*',
      fornecedores: '/api/fornecedores/*',
      empresas: '/api/empresas/*'
    })
  } catch (err) {
    logger.error('Falha ao iniciar servidor', err)
    process.exit(1)
  }
}

start()

export { app }
