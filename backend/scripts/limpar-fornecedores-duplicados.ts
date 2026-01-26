import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(80))
  console.log('🧹 LIMPEZA DE FORNECEDORES DUPLICADOS')
  console.log('='.repeat(80))
  console.log('\nRegras:')
  console.log('✅ Manter: Fornecedores com mesmo nome mas CNPJs diferentes')
  console.log('✅ Manter: Fornecedores com NFs lançadas')
  console.log('❌ Excluir: Fornecedores sem CNPJ e sem NFs (duplicados)')
  console.log('='.repeat(80))

  // Buscar todos os fornecedores
  const fornecedores = await prisma.fornecedor.findMany({
    include: {
      _count: {
        select: {
          notasFiscais: true,
          notasFiscaisSecundario: true
        }
      }
    }
  })

  // Agrupar por nome
  const grupos = new Map<string, typeof fornecedores>()
  
  for (const forn of fornecedores) {
    const nome = forn.nome.trim().toUpperCase()
    if (!grupos.has(nome)) {
      grupos.set(nome, [])
    }
    grupos.get(nome)!.push(forn)
  }

  // Filtrar apenas grupos com duplicatas
  const duplicados = Array.from(grupos.entries())
    .filter(([_, fornecedores]) => fornecedores.length > 1)

  console.log(`\n📊 Encontrados ${duplicados.length} grupos de fornecedores duplicados\n`)

  let totalExcluidos = 0
  let totalMantidos = 0

  for (const [nome, fornecedoresGrupo] of duplicados) {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`📦 ${nome} (${fornecedoresGrupo.length} registros)`)
    console.log('─'.repeat(80))

    // Verificar se todos têm CNPJs diferentes
    const cnpjs = fornecedoresGrupo.map(f => f.cnpj).filter(c => c !== null)
    const cnpjsUnicos = new Set(cnpjs)
    
    // Se todos têm CNPJs diferentes, manter todos
    if (cnpjs.length === fornecedoresGrupo.length && cnpjsUnicos.size === cnpjs.length) {
      console.log('✅ Todos têm CNPJs diferentes - MANTER TODOS')
      totalMantidos += fornecedoresGrupo.length
      for (const forn of fornecedoresGrupo) {
        const totalNfs = forn._count.notasFiscais + forn._count.notasFiscaisSecundario
        console.log(`   ✓ CNPJ: ${forn.cnpj} | Código: ${forn.codigo || '-'} | NFs: ${totalNfs}`)
      }
      continue
    }

    // Identificar quais excluir
    const paraExcluir: typeof fornecedoresGrupo = []
    const paraManter: typeof fornecedoresGrupo = []

    for (const forn of fornecedoresGrupo) {
      const totalNfs = forn._count.notasFiscais + forn._count.notasFiscaisSecundario
      
      // Manter se tem NFs
      if (totalNfs > 0) {
        paraManter.push(forn)
        continue
      }

      // Manter se tem CNPJ e não há outro com mesmo CNPJ
      if (forn.cnpj) {
        const outrosComMesmoCnpj = fornecedoresGrupo.filter(
          f => f.id !== forn.id && f.cnpj === forn.cnpj
        )
        if (outrosComMesmoCnpj.length === 0) {
          paraManter.push(forn)
          continue
        }
      }

      // Excluir se não tem CNPJ e não tem NFs
      if (!forn.cnpj && totalNfs === 0) {
        paraExcluir.push(forn)
      }
    }

    // Se todos seriam excluídos, manter o mais recente
    if (paraExcluir.length === fornecedoresGrupo.length) {
      const maisRecente = paraExcluir.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0]
      paraManter.push(maisRecente)
      paraExcluir.splice(paraExcluir.indexOf(maisRecente), 1)
      console.log('⚠️  Todos sem NFs - mantendo o mais recente')
    }

    // Exibir o que será mantido
    if (paraManter.length > 0) {
      console.log('\n✅ MANTER:')
      for (const forn of paraManter) {
        const totalNfs = forn._count.notasFiscais + forn._count.notasFiscaisSecundario
        const motivo = totalNfs > 0 ? `${totalNfs} NFs` : 'tem CNPJ único'
        console.log(`   ✓ ID: ${forn.id.substring(0, 8)}... | CNPJ: ${forn.cnpj || 'null'} | Código: ${forn.codigo || '-'} | Motivo: ${motivo}`)
      }
      totalMantidos += paraManter.length
    }

    // Exibir e excluir
    if (paraExcluir.length > 0) {
      console.log('\n❌ EXCLUIR:')
      for (const forn of paraExcluir) {
        console.log(`   ✗ ID: ${forn.id.substring(0, 8)}... | CNPJ: ${forn.cnpj || 'null'} | Código: ${forn.codigo || '-'}`)
        
        try {
          await prisma.fornecedor.delete({
            where: { id: forn.id }
          })
          totalExcluidos++
        } catch (error) {
          console.log(`   ⚠️  Erro ao excluir: ${error}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTADO FINAL')
  console.log('='.repeat(80))
  console.log(`✅ Fornecedores mantidos: ${totalMantidos}`)
  console.log(`❌ Fornecedores excluídos: ${totalExcluidos}`)
  
  const totalFinal = await prisma.fornecedor.count()
  console.log(`\n📊 Total de fornecedores após limpeza: ${totalFinal}`)
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Limpeza concluída!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
