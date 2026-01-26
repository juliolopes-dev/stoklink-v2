import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(80))
  console.log('📋 FORNECEDORES SEM CNPJ QUE POSSUEM NOTAS FISCAIS')
  console.log('='.repeat(80))

  // Buscar todos os fornecedores sem CNPJ
  const fornecedores = await prisma.fornecedor.findMany({
    where: {
      cnpj: null
    },
    include: {
      _count: {
        select: {
          notasFiscais: true,
          notasFiscaisSecundario: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  })

  // Filtrar apenas os que têm NFs
  const fornecedoresComNfs = fornecedores.filter(f => 
    f._count.notasFiscais > 0 || f._count.notasFiscaisSecundario > 0
  )

  console.log(`\n📊 Total de fornecedores sem CNPJ: ${fornecedores.length}`)
  console.log(`📊 Fornecedores sem CNPJ com NFs: ${fornecedoresComNfs.length}`)
  console.log('\n' + '='.repeat(80))

  if (fornecedoresComNfs.length === 0) {
    console.log('\n✅ Nenhum fornecedor sem CNPJ possui notas fiscais!')
    console.log('='.repeat(80))
    await prisma.$disconnect()
    return
  }

  console.log('\n📋 LISTA DE FORNECEDORES:\n')

  let totalNfsPrincipais = 0
  let totalNfsSecundarias = 0

  fornecedoresComNfs.forEach((forn, index) => {
    const totalNfs = forn._count.notasFiscais + forn._count.notasFiscaisSecundario
    totalNfsPrincipais += forn._count.notasFiscais
    totalNfsSecundarias += forn._count.notasFiscaisSecundario

    console.log(`${index + 1}. ${forn.nome}`)
    console.log(`   ID: ${forn.id}`)
    console.log(`   Código: ${forn.codigo || '-'}`)
    console.log(`   Status: ${forn.ativo ? 'Ativo' : 'Inativo'}`)
    console.log(`   NFs Principais: ${forn._count.notasFiscais}`)
    console.log(`   NFs Secundárias: ${forn._count.notasFiscaisSecundario}`)
    console.log(`   Total de NFs: ${totalNfs}`)
    console.log('')
  })

  console.log('='.repeat(80))
  console.log('📊 RESUMO GERAL')
  console.log('='.repeat(80))
  console.log(`Total de fornecedores sem CNPJ com NFs: ${fornecedoresComNfs.length}`)
  console.log(`Total de NFs principais: ${totalNfsPrincipais}`)
  console.log(`Total de NFs secundárias: ${totalNfsSecundarias}`)
  console.log(`Total geral de NFs: ${totalNfsPrincipais + totalNfsSecundarias}`)
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
