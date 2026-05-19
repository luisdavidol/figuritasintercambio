import fs from 'fs'
import path from 'path'

const TEAM_MAP = {
  'Alemania': 'GER', 'Arabia Saudita': 'KSA', 'Argelia': 'ALG', 'Argentina': 'ARG',
  'Australia': 'AUS', 'Austria': 'AUT', 'Belgica': 'BEL',
  'Bosnia Herzegovina': 'BIH', 'Brasil': 'BRA', 'Cabo Verde': 'CPV',
  'Canada': 'CAN', 'Chequia': 'CZE', 'Colombia': 'COL', 'Congo DR': 'COD',
  'Corea del Sur': 'KOR', 'Costa de Marfil': 'CIV', 'Croacia': 'CRO',
  'Curazao': 'CUW', 'Ecuador': 'ECU', 'Egipto': 'EGY', 'Escocia': 'SCO',
  'Espana': 'ESP', 'Estados Unidos': 'USA', 'Francia': 'FRA', 'Ghana': 'GHA',
  'Haiti': 'HAI', 'Inglaterra': 'ENG', 'Irak': 'IRQ', 'Iran': 'IRN',
  'Japon': 'JPN', 'Jordania': 'JOR', 'Marruecos': 'MAR', 'Mexico': 'MEX',
  'Noruega': 'NOR', 'Nueva Zelanda': 'NZL', 'Paises Bajos': 'NED',
  'Panama': 'PAN', 'Paraguay': 'PAR', 'Portugal': 'POR', 'Qatar': 'QAT',
  'Senegal': 'SEN', 'Sudafrica': 'RSA', 'Suecia': 'SWE', 'Suiza': 'SUI',
  'Tunez': 'TUN', 'Turquia': 'TUR', 'Uruguay': 'URU', 'Uzbekistan': 'UZB',
}

const SRC_DIR = path.resolve('equipos2026')
const DEST_DIR = path.resolve('public/teams')

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true })
}

const files = fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.jpeg'))

let count = 0
for (const file of files) {
  const name = file.replace(/\.jpe?g$/i, '')
  const code = TEAM_MAP[name]
  if (!code) {
    console.warn(`WARN: No mapping for "${name}"`)
    continue
  }
  const src = path.join(SRC_DIR, file)
  const dest = path.join(DEST_DIR, `${code}.jpeg`)
  fs.copyFileSync(src, dest)
  const sizeKB = (fs.statSync(src).size / 1024).toFixed(0)
  console.log(`OK: ${name} -> ${code}.jpeg (${sizeKB} KB)`)
  count++
}

console.log(`\nDone: ${count}/${files.length} JPEGs copied`)
