import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

interface CriarEmpresaInput {
  razaoSocial: string
  nomeFantasia?: string
  cnpj: string
  email: string
  telefone?: string
  endereco?: string
  cidade?: string
  uf?: string
  // Dados do usuário admin
  nomeAdmin: string
  emailAdmin: string
  senhaAdmin: string
}

interface AtualizarEmpresaInput {
  razaoSocial?: string
  nomeFantasia?: string
  telefone?: string
  endereco?: string
  cidade?: string
  uf?: string
  logo?: string
  ativo?: boolean
}

export class EmpresaService {
  async criar(input: CriarEmpresaInput) {
    // Verificar se CNPJ já existe
    const cnpjExiste = await prisma.empresa.findUnique({
      where: { cnpj: input.cnpj }
    })
    if (cnpjExiste) {
      throw new Error('CNPJ já cadastrado')
    }

    // Verificar se email da empresa já existe
    const emailEmpresaExiste = await prisma.empresa.findUnique({
      where: { email: input.email }
    })
    if (emailEmpresaExiste) {
      throw new Error('Email da empresa já cadastrado')
    }

    // Verificar se email do admin já existe
    const emailAdminExiste = await prisma.usuario.findUnique({
      where: { email: input.emailAdmin }
    })
    if (emailAdminExiste) {
      throw new Error('Email do administrador já cadastrado')
    }

    // Criar empresa e usuário admin em transação
    const senhaHash = await bcrypt.hash(input.senhaAdmin, 10)

    const empresa = await prisma.empresa.create({
      data: {
        razaoSocial: input.razaoSocial,
        nomeFantasia: input.nomeFantasia,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        endereco: input.endereco,
        cidade: input.cidade,
        uf: input.uf,
        usuarios: {
          create: {
            nome: input.nomeAdmin,
            email: input.emailAdmin,
            senha: senhaHash,
            perfil: 'ADMIN'
          }
        }
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      }
    })

    return empresa
  }

  async findById(id: string) {
    return prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            filiais: true,
            fornecedores: true,
            notasFiscais: true
          }
        }
      }
    })
  }

  async atualizar(id: string, input: AtualizarEmpresaInput) {
    return prisma.empresa.update({
      where: { id },
      data: input
    })
  }

  async findAll() {
    return prisma.empresa.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            filiais: true
          }
        }
      },
      orderBy: { razaoSocial: 'asc' }
    })
  }
}
