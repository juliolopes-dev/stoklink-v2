## Importante
Não execute prisma que va resertar o banco de dados 

Sempre que precisar alterar o schema em produção:

❌ NÃO usar prisma migrate dev ou prisma db push
✅ USAR scripts SQL manuais com IF NOT EXISTS / IF EXISTS