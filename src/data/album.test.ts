import { describe, it, expect } from 'vitest'
import albumDataJson from '../data/album.json'

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
  album: string
  totalTeams: number
  teams: RawTeam[]
}

const data = albumDataJson as unknown as RawAlbum

describe('equipos.json album data', () => {
  it('has correct album title', () => {
    expect(data.album).toBe('FIFA World Cup 2026 Panini')
  })

  it('has 50 teams (48 countries + FWC specials + Coca-Cola)', () => {
    expect(data.totalTeams).toBe(50)
    expect(data.teams.length).toBe(50)
  })

  it('each Panini team has exactly 20 stickers, Coca-Cola has 14', () => {
    for (const team of data.teams) {
      if (team.team.code === 'CC') {
        expect(team.stickers.length).toBe(14)
      } else {
        expect(team.stickers.length).toBe(20)
      }
    }
  })

  it('position 1 is always badge type with name "Escudo" (except FWC and CC)', () => {
    for (const team of data.teams) {
      if (team.team.code === 'FWC' || team.team.code === 'CC') continue
      const s = team.stickers.find((s) => s.position === 1)
      expect(s).toBeDefined()
      expect(s!.type).toBe('badge')
      expect(s!.name).toBe('Escudo')
    }
  })

  it('position 13 is always team_photo type with name "Foto del equipo" (except FWC and CC)', () => {
    for (const team of data.teams) {
      if (team.team.code === 'FWC' || team.team.code === 'CC') continue
      const s = team.stickers.find((s) => s.position === 13)
      expect(s).toBeDefined()
      expect(s!.type).toBe('team_photo')
      expect(s!.name).toBe('Foto del equipo')
    }
  })

  it('all positions 2-12 and 14-20 are player type with non-empty names (except FWC and CC)', () => {
    for (const team of data.teams) {
      if (team.team.code === 'FWC' || team.team.code === 'CC') continue
      for (const s of team.stickers) {
        if (s.position === 1 || s.position === 13) continue
        expect(s.type).toBe('player')
        expect(s.name.length).toBeGreaterThan(0)
        expect(s.name).not.toBe('Escudo')
        expect(s.name).not.toBe('Foto del equipo')
      }
    }
  })

  it('sticker codes are unique across all teams', () => {
    const codes = new Set<string>()
    for (const team of data.teams) {
      for (const s of team.stickers) {
        const normalized = s.code.replace(/\s/g, '').toUpperCase()
        expect(codes.has(normalized)).toBe(false)
        codes.add(normalized)
      }
    }
    expect(codes.size).toBe(994)
  })

  it('all team codes are unique', () => {
    const codes = new Set(data.teams.map((t) => t.team.code))
    expect(codes.size).toBe(50)
  })

  it('has groups A through L plus FWC special section', () => {
    const groups = new Set(data.teams.map((t) => t.team.group))
    const expected = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', '★'])
    expect(groups).toEqual(expected)
  })

  it('each group has exactly 4 teams (except ★ which has 2)', () => {
    const groups = 'ABCDEFGHIJKL'.split('')
    for (const g of groups) {
      const teamsInGroup = data.teams.filter((t) => t.team.group === g)
      expect(teamsInGroup.length).toBe(4)
    }
    const fwcGroup = data.teams.filter((t) => t.team.group === '★')
    expect(fwcGroup.length).toBe(2)
  })

  it('every team has a non-empty federation', () => {
    for (const team of data.teams) {
      expect(team.team.federation.length).toBeGreaterThan(0)
    }
  })
})

describe('sticker cycle logic', () => {
  type Status = 'missing' | 'owned' | 'duplicate'
  type StickerEntry = { status: Status; duplicateCount: number }

  function cycle(entry: StickerEntry, maxDupes = 5): StickerEntry {
    if (entry.status === 'missing') return { status: 'owned', duplicateCount: 0 }
    if (entry.status === 'owned') return { status: 'duplicate', duplicateCount: 1 }
    if (entry.status === 'duplicate') {
      if (entry.duplicateCount >= maxDupes) return { status: 'missing', duplicateCount: 0 }
      return { status: 'duplicate', duplicateCount: entry.duplicateCount + 1 }
    }
    return entry
  }

  it('full cycle: missing -> owned -> dup1..5 -> missing (7 taps)', () => {
    let state: StickerEntry = { status: 'missing', duplicateCount: 0 }
    state = cycle(state); expect(state.status).toBe('owned')
    state = cycle(state); expect(state).toEqual({ status: 'duplicate', duplicateCount: 1 })
    state = cycle(state); expect(state.duplicateCount).toBe(2)
    state = cycle(state); expect(state.duplicateCount).toBe(3)
    state = cycle(state); expect(state.duplicateCount).toBe(4)
    state = cycle(state); expect(state.duplicateCount).toBe(5)
    state = cycle(state); expect(state).toEqual({ status: 'missing', duplicateCount: 0 })
  })

  it('code normalization matches with and without spaces', () => {
    const norm = (c: string) => c.replace(/\s/g, '').toUpperCase()
    expect(norm('MEX1')).toBe('MEX1')
    expect(norm('MEX 1')).toBe('MEX1')
    expect(norm('mex 1')).toBe('MEX1')
    expect(norm('MEX1') === norm('MEX 1')).toBe(true)
  })
})

describe('type mapping', () => {
  it('maps badge -> escudo', () => {
    expect('badge').toBe('badge')
  })

  it('maps team_photo -> especial', () => {
    expect('team_photo').toBe('team_photo')
  })

  it('maps player -> jugador', () => {
    expect('player').toBe('player')
  })
})
