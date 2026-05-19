import { useState, useMemo } from 'react'
import albumData from '../data/album.json'

export interface StickerInfo {
  position: number
  code: string
  teamCode: string
  country: string
  playerName: string
  type: string
  section: string
}

interface RawSticker {
  position: number
  code: string
  type: string
  name: string
}

interface RawTeam {
  team: {
    code: string
    name: string
    federation: string
    group: string
  }
  stickers: RawSticker[]
}

interface RawAlbum {
  totalTeams: number
  teams: RawTeam[]
}

function buildCatalog(): {
  catalog: StickerInfo[]
  countries: string[]
} {
  const raw = albumData as unknown as RawAlbum
  const catalog: StickerInfo[] = []
  const countrySet = new Set<string>()

  for (const t of raw.teams) {
    const teamCode = t.team.code
    const countryName = t.team.name
    countrySet.add(countryName)

    for (const s of t.stickers) {
      const code = s.code.replace(/\s/g, '')
      const type = s.type === 'badge' ? 'escudo'
        : s.type === 'team_photo' ? 'especial'
        : 'jugador'

      catalog.push({
        position: s.position,
        code,
        teamCode,
        country: countryName,
        playerName: s.name,
        type,
        section: 'equipos',
      })
    }
  }

  return { catalog, countries: Array.from(countrySet).sort() }
}

const { catalog: prebuilt, countries: prebuiltCountries } = buildCatalog()

export function useCatalog() {
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const catalog = useMemo(() => prebuilt, [])

  const filtered = useMemo(() => {
    return catalog.filter((s) => {
      if (selectedCountry && s.country !== selectedCountry) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.code.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.playerName.toLowerCase().includes(q) ||
          s.position.toString().includes(q)
        )
      }
      return true
    })
  }, [catalog, search, selectedCountry])

  const findByCode = (code: string) =>
    catalog.find((s) => s.code.toUpperCase() === code.replace(/\s/g, '').toUpperCase())

  const findByNumber = (num: number) =>
    catalog.find((s) => s.position === num)

  return {
    catalog,
    filtered,
    countries: prebuiltCountries,
    search,
    setSearch,
    selectedCountry,
    setSelectedCountry,
    findByCode,
    findByNumber,
  }
}
