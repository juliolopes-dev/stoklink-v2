import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
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
  logger: true
})

// Plugins
app.register(cors, {
  origin: true
})

app.register(jwt, {
  secret: env.JWT_SECRET
})

// Routes
app.register(authRoutes)
app.register(filialRoutes)
app.register(usuarioRoutes)
app.register(notaFiscalRoutes)
app.register(conferenciaRoutes)
app.register(divergenciaRoutes)
app.register(distribuicaoRoutes)
app.register(fornecedorRoutes)
app.register(empresaRoutes)

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

export { app }
