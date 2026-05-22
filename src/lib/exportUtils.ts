import type { UserSticker } from '../hooks/useUserStickers'
import type { StickerInfo } from '../hooks/useAlbumData'

function iso2Flag(iso2: string): string {
  const a = iso2.charCodeAt(0) - 65
  const b = iso2.charCodeAt(1) - 65
  return String.fromCodePoint(0x1F1E6 + a, 0x1F1E6 + b)
}

const FIFA_TO_ISO: Record<string, string> = {
  ALG: 'DZ', ARG: 'AR', AUS: 'AU', AUT: 'AT', BEL: 'BE', BIH: 'BA',
  BRA: 'BR', CAN: 'CA', CIV: 'CI', COD: 'CD', COL: 'CO', CPV: 'CV',
  CRO: 'HR', CUW: 'CW', CZE: 'CZ', ECU: 'EC', EGY: 'EG', ESP: 'ES',
  FRA: 'FR', GER: 'DE', GHA: 'GH', HAI: 'HT', IRN: 'IR', IRQ: 'IQ',
  JOR: 'JO', JPN: 'JP', KOR: 'KR', KSA: 'SA', MAR: 'MA', MEX: 'MX',
  NED: 'NL', NOR: 'NO', NZL: 'NZ', PAN: 'PA', PAR: 'PY', POR: 'PT',
  QAT: 'QA', RSA: 'ZA', SEN: 'SN', SUI: 'CH', SWE: 'SE', TUN: 'TN',
  TUR: 'TR', URU: 'UY', USA: 'US', UZB: 'UZ',
}

const SPECIAL_FLAGS: Record<string, string> = {
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  SCO: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
}

function getFlag(teamCode: string): string {
  if (SPECIAL_FLAGS[teamCode]) return SPECIAL_FLAGS[teamCode]
  const iso2 = FIFA_TO_ISO[teamCode]
  if (iso2) return iso2Flag(iso2)
  return ''
}

function groupByTeam(
  codes: string[],
  allStickers: StickerInfo[]
): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>()
  const stickerMap = new Map<string, StickerInfo>()
  allStickers.forEach((s) => stickerMap.set(s.code, s))

  for (const code of codes) {
    const info = stickerMap.get(code)
    if (!info) continue
    const teamCode = info.teamCode
    if (!map.has(teamCode)) map.set(teamCode, new Set())
    map.get(teamCode)!.add(info.position)
  }

  return map
}

function formatGroup(teamCode: string, positions: Set<number>): string {
  const sorted = Array.from(positions).sort((a, b) => a - b)
  const nums = sorted.join(', ')
  const flag = getFlag(teamCode)
  return flag ? `${teamCode} ${flag}: ${nums}` : `${teamCode}: ${nums}`
}

export function generateExportText(
  userStickers: Map<string, UserSticker>,
  allStickers: StickerInfo[]
): string {
  const myOwnedSet = new Set<string>()
  const myDupes: string[] = []

  userStickers.forEach((s) => {
    if (s.status === 'owned' || s.status === 'duplicate') {
      myOwnedSet.add(s.stickerCode)
    }
    if (s.status === 'duplicate' && s.duplicateCount > 0) {
      myDupes.push(s.stickerCode)
    }
  })

  const allCodes = new Set(allStickers.map((s) => s.code))
  const missing = Array.from(allCodes).filter((c) => !myOwnedSet.has(c))

  const missingGroups = groupByTeam(missing, allStickers)
  const duplicateGroups = groupByTeam(myDupes, allStickers)

  const lines: string[] = []

  lines.push('Me faltan')
  const teamOrder = Array.from(new Set(allStickers.map((s) => s.teamCode)))
  for (const teamCode of teamOrder) {
    const positions = missingGroups.get(teamCode)
    if (positions && positions.size > 0) {
      lines.push(formatGroup(teamCode, positions))
    }
  }

  lines.push('')
  lines.push('Repetidas')
  for (const teamCode of teamOrder) {
    const positions = duplicateGroups.get(teamCode)
    if (positions && positions.size > 0) {
      lines.push(formatGroup(teamCode, positions))
    }
  }

  return lines.join('\n')
}
