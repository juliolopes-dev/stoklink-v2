import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuarioId = '0eb3c2a2-02ea-466c-a9c9-a8e6fd2120f8'
  
  // Buscar usuário e empresa
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { empresa: true }
  })
  
  if (!usuario) {
    console.log('Usuário não encontrado')
    return
  }
  
  console.log('Usuário:', usuario.nome)
  console.log('Empresa:', usuario.empresa.nome)
  
  // Buscar filiais da empresa
  const filiais = await prisma.filial.findMany({
    where: { empresaId: usuario.empresaId }
  })
  
  console.log('Filiais:', filiais.map(f => `${f.nome} (${f.codigo})`))
  
  if (filiais.length < 2) {
    console.log('Precisa de pelo menos 2 filiais')
    return
  }
  
  const filial1 = filiais[0]
  const filial2 = filiais[1]
  
  // Criar NF de teste 1 - Aguardando conferência
  const nf1 = await prisma.notaFiscal.create({
    data: {
      empresaId: usuario.empresaId,
      numero: '999001',
      serie: '1',
      fornecedorNome: 'FORNECEDOR TESTE LTDA',
      fornecedorCnpj: '12345678000199',
      dataEmissao: new Date(),
      valorTotal: 1500.00,
      quantidadeVolumes: 3,
      tipoMovimentacao: 'RECEBIMENTO_DIRETO',
      status: 'AGUARDANDO_CONFERENCIA',
      filialDestinoId: filial1.id,
      usuarioCadastroId: usuarioId,
      itens: {
        create: [
          { codigoProduto: 'PROD-001', descricao: 'ROLAMENTO 6201', ncm: '84821010', unidade: 'PC', quantidadeNota: 10, valorUnitario: 25.00, valorTotal: 250.00 },
          { codigoProduto: 'PROD-002', descricao: 'CORREIA DENTADA', ncm: '40103100', unidade: 'PC', quantidadeNota: 5, valorUnitario: 80.00, valorTotal: 400.00 },
          { codigoProduto: 'PROD-003', descricao: 'TENSOR CORREIA', ncm: '84834090', unidade: 'PC', quantidadeNota: 3, valorUnitario: 150.00, valorTotal: 450.00 },
        ]
      }
    }
  })
  console.log('NF1 criada:', nf1.numero, '- Status:', nf1.status)
  
  // Criar NF de teste 2 - Pendente transferência (para testar 2ª conferência)
  const nf2 = await prisma.notaFiscal.create({
    data: {
      empresaId: usuario.empresaId,
      numero: '999002',
      serie: '1',
      fornecedorNome: 'DISTRIBUIDORA ABC',
      fornecedorCnpj: '98765432000188',
      dataEmissao: new Date(),
      valorTotal: 2800.00,
      quantidadeVolumes: 5,
      tipoMovimentacao: 'RECEBIMENTO_INDIRETO',
      status: 'AGUARDANDO_CONFERENCIA_DESTINO',
      filialRecebimentoId: filial1.id,
      filialDestinoId: filial2.id,
      usuarioCadastroId: usuarioId,
      itens: {
        create: [
          { codigoProduto: 'ABC-100', descricao: 'AMORTECEDOR DIANTEIRO', ncm: '87088000', unidade: 'PC', quantidadeNota: 4, valorUnitario: 350.00, valorTotal: 1400.00 },
          { codigoProduto: 'ABC-101', descricao: 'AMORTECEDOR TRASEIRO', ncm: '87088000', unidade: 'PC', quantidadeNota: 4, valorUnitario: 280.00, valorTotal: 1120.00 },
          { codigoProduto: 'ABC-102', descricao: 'KIT BATENTE', ncm: '40169300', unidade: 'KIT', quantidadeNota: 2, valorUnitario: 140.00, valorTotal: 280.00 },
        ]
      }
    }
  })
  
  // Criar conferência de volumes para NF2 (1ª conferência já feita)
  await prisma.conferenciaVolume.create({
    data: {
      notaFiscalId: nf2.id,
      usuarioId: usuarioId,
      tipo: 'RECEBIMENTO',
      filialId: filial1.id,
      volumesEsperados: 5,
      volumesRecebidos: 5,
      volumesBatendo: true
    }
  })
  
  console.log('NF2 criada:', nf2.numero, '- Status:', nf2.status, '(aguardando 2ª conferência)')
  
  // Criar NF de teste 3 - Volumes conferidos, aguardando itens
  const nf3 = await prisma.notaFiscal.create({
    data: {
      empresaId: usuario.empresaId,
      numero: '999003',
      serie: '1',
      fornecedorNome: 'PECAS XYZ LTDA',
      fornecedorCnpj: '11222333000144',
      dataEmissao: new Date(),
      valorTotal: 950.00,
      quantidadeVolumes: 2,
      tipoMovimentacao: 'RECEBIMENTO_DIRETO',
      status: 'VOLUMES_CONFERIDOS',
      filialRecebimentoId: filial1.id,
      filialDestinoId: filial1.id,
      usuarioCadastroId: usuarioId,
      itens: {
        create: [
          { codigoProduto: 'XYZ-001', descricao: 'PASTILHA FREIO DIANTEIRA', ncm: '68138100', unidade: 'JG', quantidadeNota: 6, valorUnitario: 85.00, valorTotal: 510.00 },
          { codigoProduto: 'XYZ-002', descricao: 'DISCO FREIO VENTILADO', ncm: '87083010', unidade: 'PC', quantidadeNota: 2, valorUnitario: 220.00, valorTotal: 440.00 },
        ]
      }
    }
  })
  
  // Criar conferência de volumes para NF3
  await prisma.conferenciaVolume.create({
    data: {
      notaFiscalId: nf3.id,
      usuarioId: usuarioId,
      tipo: 'RECEBIMENTO',
      filialId: filial1.id,
      volumesEsperados: 2,
      volumesRecebidos: 2,
      volumesBatendo: true
    }
  })
  
  console.log('NF3 criada:', nf3.numero, '- Status:', nf3.status, '(aguardando conferência de itens)')
  
  console.log('\n✅ Dados de teste inseridos com sucesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
