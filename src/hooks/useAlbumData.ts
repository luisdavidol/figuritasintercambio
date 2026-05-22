import { useState, useMemo } from 'react'
import albumData from '../../equipos.json'

export interface TeamInfo {
  code: string
  name: string
  federation: string
  group: string
}

export interface StickerInfo {
  position: number
  code: string
  type: 'badge' | 'player' | 'team_photo' | 'intro' | 'official_emblem' | 'official_item' | 'official_mascots' | 'official_slogan' | 'official_ball' | 'host_country_emblem' | 'world_cup_history'
  name: string
  teamCode: string
  teamName: string
}

export interface AlbumTeam {
  team: TeamInfo
  stickers: StickerInfo[]
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
  album: string
  totalTeams: number
  teams: RawTeam[]
}

export function useAlbumData() {
  const [search, setSearch] = useState('')

  const data = useMemo(() => {
    const raw = albumData as unknown as RawAlbum
    const teams: AlbumTeam[] = raw.teams.map((t) => ({
      team: {
        code: t.team.code,
        name: t.team.name,
        federation: t.team.federation,
        group: t.team.group,
      },
      stickers: t.stickers.map((s) => ({
        position: s.position,
        code: s.code.replace(/\s/g, ''),
        type: s.type as StickerInfo['type'],
        name: s.name,
        teamCode: t.team.code,
        teamName: t.team.name,
      })),
    }))

    const allStickers: StickerInfo[] = teams.flatMap((t) => t.stickers)

    const groups = Array.from(new Set(teams.map((t) => t.team.group))).sort()

    return { teams, allStickers, groups }
  }, [])

  const filteredTeams = useMemo(() => {
    if (!search) return data.teams
    const q = search.toLowerCase()
    return data.teams.filter(
      (t) =>
        t.team.name.toLowerCase().includes(q) ||
        t.team.code.toLowerCase().includes(q) ||
        t.team.group.toLowerCase().includes(q) ||
        t.stickers.some((s) => s.name.toLowerCase().includes(q))
    )
  }, [data.teams, search])

  const getTeamByCode = (code: string) => data.teams.find((t) => t.team.code === code.toUpperCase())

  const getStickerByCode = (code: string) => {
    const cleaned = code.replace(/\s/g, '').toUpperCase()
    return data.allStickers.find((s) => s.code.replace(/\s/g, '').toUpperCase() === cleaned)
  }

  return {
    teams: data.teams,
    allStickers: data.allStickers,
    groups: data.groups,
    search,
    setSearch,
    filteredTeams,
    getTeamByCode,
    getStickerByCode,
  }
}
