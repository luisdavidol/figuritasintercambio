export interface ParsedReport {
  missing: string[]
  duplicates: string[]
  parseErrors: string[]
}

export function parseExternalReport(text: string): ParsedReport {
  const missing: string[] = []
  const duplicates: string[] = []
  const parseErrors: string[] = []

  const lines = text.split(/\r?\n/)
  let section: 'missing' | 'duplicates' | null = null

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue

    const lower = raw.toLowerCase()

    if (lower.includes('me faltan') || lower.includes('faltan')) {
      section = 'missing'
      continue
    }

    if (lower.includes('repetidas') || lower.includes('repetidos') || lower.includes('repes')) {
      section = 'duplicates'
      continue
    }

    if (!section) {
      parseErrors.push(`Linea ${i + 1}: seccion no detectada. Empieza con "Me faltan" o "Repetidas".`)
      continue
    }

    const match = raw.match(/^([A-Z]{3})[^:]*:\s*(.+)$/)
    if (!match) {
      parseErrors.push(`Linea ${i + 1}: "${raw}" no tiene formato valido (ej: MEX: 13 o USA: 9, 14).`)
      continue
    }

    const code = match[1]
    const numbersStr = match[2]

    const numbers = numbersStr.split(',').map((n) => n.trim()).filter((n) => /^\d+$/.test(n))

    if (numbers.length === 0) {
      parseErrors.push(`Linea ${i + 1}: "${raw}" no tiene numeros validos despues de los dos puntos.`)
      continue
    }

    for (const num of numbers) {
      const stickerCode = `${code}${parseInt(num, 10)}`
      if (section === 'missing') {
        missing.push(stickerCode)
      } else {
        duplicates.push(stickerCode)
      }
    }
  }

  return { missing, duplicates, parseErrors }
}
