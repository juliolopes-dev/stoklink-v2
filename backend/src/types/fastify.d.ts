import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      perfil: string
      empresaId: string
      filialId: string | null
    }
    user: {
      id: string
      email: string
      perfil: string
      empresaId: string
      filialId: string | null
    }
  }
}
