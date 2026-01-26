import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface FornecedorCSV {
  codigo: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
}

function normalizarCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null
  return cnpj.replace(/\D/g, '')
}

// Fornecedores que não foram encontrados no banco
const fornecedoresFaltantes = [
  { codigo: '000014', cnpj: '01027688000166' },
  { codigo: '000643', cnpj: '08844800000109' },
  { codigo: '000843', cnpj: '10827136000123' },
  { codigo: '000845', cnpj: '21899841000152' },
  { codigo: '000847', cnpj: '29478110000145' },
  { codigo: '000849', cnpj: '54411565000190' }
]

async function main() {
  console.log('='.repeat(80))
  console.log('📝 CADASTRANDO FORNECEDORES FALTANTES')
  console.log('='.repeat(80))

  // Buscar empresa padrão (primeira empresa ativa)
  console.log('\n🏢 Buscando empresa...')
  const empresa = await prisma.empresa.findFirst({
    where: { ativo: true },
    select: { id: true, razaoSocial: true }
  })

  if (!empresa) {
    console.error('❌ Nenhuma empresa ativa encontrada!')
    process.exit(1)
  }

  console.log(`✅ Empresa: ${empresa.razaoSocial}`)

  // Ler CSV para buscar dados completos
  console.log('\n📄 Lendo CSV...')
  const fornecedoresCSV: FornecedorCSV[] = []
  const csvPath = path.join(__dirname, '../../dados-bezerra._public_._dim_fornecedor_.csv')
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: any) => {
        const cnpjNormalizado = normalizarCNPJ(row.cgccpf)
        
        // Verificar se é um dos fornecedores faltantes
        const isFaltante = fornecedoresFaltantes.some(
          f => f.cnpj === cnpjNormalizado
        )

        if (isFaltante) {
          fornecedoresCSV.push({
            codigo: row.codfornec,
            nome: row.nome,
            cnpj: cnpjNormalizado,
            email: row.email || null,
            telefone: row.fone || null,
            endereco: row.endereco || null,
            cidade: row.codcidade || null,
            uf: row.estado || null
          })
        }
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`✅ Encontrados ${fornecedoresCSV.length} fornecedores no CSV`)

  if (fornecedoresCSV.length === 0) {
    console.log('⚠️  Nenhum fornecedor para cadastrar')
    await prisma.$disconnect()
    return
  }

  // Cadastrar fornecedores
  console.log('\n📝 Cadastrando fornecedores...')
  let sucesso = 0
  let erros = 0
  const errosDetalhes: string[] = []

  for (const forn of fornecedoresCSV) {
    try {
      // Verificar se já existe (por segurança)
      const existe = await prisma.fornecedor.findFirst({
        where: {
          empresaId: empresa.id,
          cnpj: forn.cnpj
        }
      })

      if (existe) {
        console.log(`  ⚠️  [${forn.codigo}] ${forn.nome} - Já existe`)
        continue
      }

      // Cadastrar
      await prisma.fornecedor.create({
        data: {
          empresaId: empresa.id,
          codigo: forn.codigo,
          nome: forn.nome,
          cnpj: forn.cnpj,
          email: forn.email,
          telefone: forn.telefone,
          endereco: forn.endereco,
          cidade: forn.cidade,
          uf: forn.uf,
          ativo: true
        }
      })

      sucesso++
      console.log(`  ✅ [${forn.codigo}] ${forn.nome}`)
    } catch (error) {
      erros++
      errosDetalhes.push(`[${forn.codigo}] ${forn.nome} - Erro: ${error}`)
      console.log(`  ❌ [${forn.codigo}] ${forn.nome} - Erro`)
    }
  }

  // Resultado
  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTADO')
  console.log('='.repeat(80))
  console.log(`✅ Cadastrados: ${sucesso}`)
  console.log(`❌ Erros: ${erros}`)

  if (erros > 0) {
    console.log('\n⚠️  Detalhes dos erros:')
    errosDetalhes.forEach(erro => console.log(`  ${erro}`))
  }

  // Validação final
  console.log('\n🔍 Validação final...')
  const totalFornecedores = await prisma.fornecedor.count()
  const comCodigo = await prisma.fornecedor.count({
    where: { codigo: { not: null } }
  })

  console.log(`📊 Total de fornecedores: ${totalFornecedores}`)
  console.log(`📊 Fornecedores com código: ${comCodigo}`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Processo concluído!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
