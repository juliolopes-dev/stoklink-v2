import { prisma } from '../src/lib/prisma.js'

async function run() {
  const nf = await prisma.notaFiscal.findFirst({
    where: { numeroSecundario: '112158' },
    select: { id: true, numero: true, numeroSecundario: true }
  })
  
  console.log('NF encontrada:', nf)
  
  if (nf) {
    const deleted = await prisma.itemNfSecundaria.deleteMany({
      where: { notaFiscalId: nf.id }
    })
    console.log('Itens deletados:', deleted.count)
  } else {
    console.log('NF com número secundário 112158 não encontrada')
  }
  
  await prisma.$disconnect()
}

run()
