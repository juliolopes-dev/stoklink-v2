import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomBytes } from 'crypto'

// Diretório para upload de DANFs secundários
const uploadsDir = path.join(__dirname, '../../uploads/danf-secundarios')

// Criar diretório se não existir
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('📁 Diretório de uploads criado:', uploadsDir)
}

// Configuração do Multer para upload de PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Gerar nome único: notaFiscalId-timestamp-random.pdf
    const notaFiscalId = req.params.id
    const timestamp = Date.now()
    const randomString = randomBytes(4).toString('hex')
    const filename = `${notaFiscalId}-${timestamp}-${randomString}.pdf`
    cb(null, filename)
  }
})

// Filtro para aceitar apenas PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos'))
  }
}

// Configuração do upload
export const uploadDanf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Máximo 10MB
  }
})
