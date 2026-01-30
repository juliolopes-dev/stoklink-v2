import { prisma } from '../src/lib/prisma.js'

async function run() {
  const nf = await prisma.notaFiscal.findFirst({
    where: { numeroSecundario: '12286' },
    select: { id: true, numero: true, numeroSecundario: true }
  })
  
  console.log('NF:', nf)
  
  if (nf) {
    const itens = await prisma.itemNfSecundaria.findMany({
      where: { notaFiscalId: nf.id },
      select: { codigo: true, descricao: true, quantidade: true }
    })
    console.log('Total itens:', itens.length)
    console.log('Itens com codigo 122278:', itens.filter(i => i.codigo === '122278'))
  }
  
  await prisma.$disconnect()
}

run()
