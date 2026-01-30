import { prisma } from '../src/lib/prisma.js'

async function run() {
  const nf = await prisma.notaFiscal.findFirst({
    where: { numeroSecundario: '12286' },
    select: { id: true, numero: true, numeroSecundario: true }
  })
  
  console.log('NF encontrada:', nf)
  
  if (nf) {
    const deleted = await prisma.itemNfSecundaria.deleteMany({
      where: { notaFiscalId: nf.id }
    })
    console.log('Itens deletados:', deleted.count)
  }
  
  await prisma.$disconnect()
}

run()
