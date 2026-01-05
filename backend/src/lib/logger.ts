const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
}

function getTimestamp() {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatMethod(method: string) {
  const methodColors: Record<string, string> = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta
  }
  return `${methodColors[method] || colors.white}${method.padEnd(6)}${colors.reset}`
}

function formatStatusCode(statusCode: number) {
  if (statusCode >= 500) return `${colors.red}${statusCode}${colors.reset}`
  if (statusCode >= 400) return `${colors.yellow}${statusCode}${colors.reset}`
  if (statusCode >= 300) return `${colors.cyan}${statusCode}${colors.reset}`
  return `${colors.green}${statusCode}${colors.reset}`
}

function formatResponseTime(ms: number) {
  if (ms > 1000) return `${colors.red}${ms.toFixed(0)}ms${colors.reset}`
  if (ms > 500) return `${colors.yellow}${ms.toFixed(0)}ms${colors.reset}`
  return `${colors.green}${ms.toFixed(0)}ms${colors.reset}`
}

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}ℹ INFO${colors.reset}  ${message}`, data ? JSON.stringify(data) : '')
  },

  success: (message: string, data?: unknown) => {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}✓ OK${colors.reset}    ${message}`, data ? JSON.stringify(data) : '')
  },

  warn: (message: string, data?: unknown) => {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}⚠ WARN${colors.reset}  ${message}`, data ? JSON.stringify(data) : '')
  },

  error: (message: string, error?: unknown) => {
    console.error(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}✖ ERROR${colors.reset} ${message}`)
    if (error instanceof Error) {
      console.error(`${colors.gray}         └─ ${error.message}${colors.reset}`)
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 4)
        stackLines.forEach(line => {
          console.error(`${colors.gray}            ${line.trim()}${colors.reset}`)
        })
      }
    } else if (error) {
      console.error(`${colors.gray}         └─ ${JSON.stringify(error)}${colors.reset}`)
    }
  },

  request: (method: string, url: string, statusCode: number, responseTime: number, userId?: string) => {
    const userInfo = userId ? `${colors.gray}[user:${userId.slice(0, 8)}]${colors.reset}` : ''
    console.log(
      `${colors.gray}[${getTimestamp()}]${colors.reset} ${formatMethod(method)} ${url.padEnd(40)} ${formatStatusCode(statusCode)} ${formatResponseTime(responseTime)} ${userInfo}`
    )
  },

  startup: (port: number, env: string) => {
    console.log('')
    console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}                                                            ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}   ${colors.bright}${colors.green}🚀 StokLink API Server${colors.reset}                                 ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}                                                            ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}   ${colors.gray}Porta:${colors.reset}     ${colors.white}${port}${colors.reset}                                         ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}   ${colors.gray}Ambiente:${colors.reset}  ${env === 'production' ? colors.green : colors.yellow}${env}${colors.reset}                                  ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}   ${colors.gray}Horário:${colors.reset}   ${colors.white}${getTimestamp()}${colors.reset}                        ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}║${colors.reset}                                                            ${colors.bright}${colors.cyan}║${colors.reset}`)
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`)
    console.log('')
  },

  db: (message: string, success = true) => {
    const icon = success ? `${colors.green}✓${colors.reset}` : `${colors.red}✖${colors.reset}`
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.magenta}🗄 DB${colors.reset}    ${icon} ${message}`)
  },

  route: (method: string, path: string) => {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.cyan}📍 ROUTE${colors.reset} ${formatMethod(method)} ${path}`)
  }
}
