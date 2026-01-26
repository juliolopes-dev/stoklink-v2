import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface FornecedorCSV {
  codigo: string
  nome: string
  cnpj: string | null
}

interface Match {
  id: string
  codigo: string
  nomeBanco: string
  nomeCSV: string
  cnpj: string | null
  tipo: 'cnpj' | 'nome' | 'similar'
  similaridade?: number
}

function normalizarCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null
  return cnpj.replace(/\D/g, '')
}

function calcularSimilaridade(a: string, b: string): number {
  const s1 = a.toLowerCase()
  const s2 = b.toLowerCase()
  
  let matches = 0
  const len = Math.min(s1.length, s2.length)
  
  for (let i = 0; i < len; i++) {
    if (s1[i] === s2[i]) matches++
  }
  
  return matches / Math.max(s1.length, s2.length)
}

async function main() {
  console.log('='.repeat(80))
  console.log('📊 COMPARAÇÃO DE CÓDIGOS DE FORNECEDORES')
  console.log('='.repeat(80))

  // Ler CSV
  console.log('\n📄 Lendo CSV...')
  const fornecedoresCSV: FornecedorCSV[] = []
  const csvPath = path.join(__dirname, '../../dados-bezerra._public_._dim_fornecedor_.csv')
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: any) => {
        fornecedoresCSV.push({
          codigo: row.codfornec,
          nome: row.nome,
          cnpj: normalizarCNPJ(row.cgccpf)
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`✅ CSV: ${fornecedoresCSV.length} fornecedores`)

  // Buscar fornecedores do banco
  console.log('\n💾 Buscando fornecedores do banco...')
  const fornecedoresBanco = await prisma.fornecedor.findMany({
    select: {
      id: true,
      nome: true,
      cnpj: true
    },
    orderBy: { nome: 'asc' }
  })

  console.log(`✅ Banco: ${fornecedoresBanco.length} fornecedores`)

  // Comparar
  console.log('\n🔍 Comparando...')
  const matchesCNPJ: Match[] = []
  const matchesNome: Match[] = []
  const matchesSimilar: Match[] = []
  const naoEncontrados: FornecedorCSV[] = []

  for (const csvForn of fornecedoresCSV) {
    let encontrado = false

    // 1. Tentar match por CNPJ
    if (csvForn.cnpj) {
      for (const bancoForn of fornecedoresBanco) {
        const bancoCNPJ = normalizarCNPJ(bancoForn.cnpj)
        if (bancoCNPJ && csvForn.cnpj === bancoCNPJ) {
          matchesCNPJ.push({
            id: bancoForn.id,
            codigo: csvForn.codigo,
            nomeBanco: bancoForn.nome,
            nomeCSV: csvForn.nome,
            cnpj: bancoForn.cnpj,
            tipo: 'cnpj'
          })
          encontrado = true
          break
        }
      }
    }

    // 2. Tentar match por nome exato
    if (!encontrado) {
      for (const bancoForn of fornecedoresBanco) {
        if (csvForn.nome.toUpperCase() === bancoForn.nome.toUpperCase()) {
          matchesNome.push({
            id: bancoForn.id,
            codigo: csvForn.codigo,
            nomeBanco: bancoForn.nome,
            nomeCSV: csvForn.nome,
            cnpj: bancoForn.cnpj,
            tipo: 'nome'
          })
          encontrado = true
          break
        }
      }
    }

    // 3. Tentar match por similaridade (>= 80%)
    if (!encontrado) {
      let melhorMatch: Match | null = null
      let melhorScore = 0

      for (const bancoForn of fornecedoresBanco) {
        const score = calcularSimilaridade(csvForn.nome, bancoForn.nome)
        if (score >= 0.8 && score > melhorScore) {
          melhorScore = score
          melhorMatch = {
            id: bancoForn.id,
            codigo: csvForn.codigo,
            nomeBanco: bancoForn.nome,
            nomeCSV: csvForn.nome,
            cnpj: bancoForn.cnpj,
            tipo: 'similar',
            similaridade: Math.round(score * 100)
          }
        }
      }

      if (melhorMatch) {
        matchesSimilar.push(melhorMatch)
        encontrado = true
      }
    }

    if (!encontrado) {
      naoEncontrados.push(csvForn)
    }
  }

  // Relatório
  console.log('\n' + '='.repeat(80))
  console.log('📋 RESULTADO')
  console.log('='.repeat(80))
  console.log(`✅ Matches por CNPJ: ${matchesCNPJ.length}`)
  console.log(`✅ Matches por Nome: ${matchesNome.length}`)
  console.log(`⚠️  Matches Similares: ${matchesSimilar.length}`)
  console.log(`❌ Não encontrados: ${naoEncontrados.length}`)

  // Salvar mapeamento (CNPJ + Nome exato)
  const todosMatches = [...matchesCNPJ, ...matchesNome]
  const mapeamentoPath = path.join(__dirname, '../../mapeamento-codigos.json')
  fs.writeFileSync(mapeamentoPath, JSON.stringify(todosMatches, null, 2))
  console.log(`\n✅ Mapeamento salvo: mapeamento-codigos.json (${todosMatches.length} fornecedores)`)

  // Salvar relatório completo
  const relatorioPath = path.join(__dirname, '../../relatorio-comparacao.txt')
  let relatorio = ''
  
  relatorio += 'MATCHES POR CNPJ\n' + '='.repeat(80) + '\n'
  matchesCNPJ.forEach(m => {
    relatorio += `[${m.codigo}] ${m.nomeCSV}\n`
    relatorio += `  → ${m.nomeBanco}\n`
    relatorio += `  → CNPJ: ${m.cnpj}\n\n`
  })

  relatorio += '\n\nMATCHES POR NOME\n' + '='.repeat(80) + '\n'
  matchesNome.forEach(m => {
    relatorio += `[${m.codigo}] ${m.nomeCSV}\n`
    relatorio += `  → ${m.nomeBanco}\n\n`
  })

  relatorio += '\n\nMATCHES SIMILARES (>80%)\n' + '='.repeat(80) + '\n'
  matchesSimilar.forEach(m => {
    relatorio += `[${m.codigo}] ${m.nomeCSV} (${m.similaridade}%)\n`
    relatorio += `  → ${m.nomeBanco}\n\n`
  })

  relatorio += '\n\nNÃO ENCONTRADOS\n' + '='.repeat(80) + '\n'
  naoEncontrados.forEach(f => {
    relatorio += `[${f.codigo}] ${f.nome}\n`
    if (f.cnpj) relatorio += `  CNPJ: ${f.cnpj}\n`
    relatorio += '\n'
  })

  fs.writeFileSync(relatorioPath, relatorio)
  console.log(`✅ Relatório salvo: relatorio-comparacao.txt`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Análise concluída!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
