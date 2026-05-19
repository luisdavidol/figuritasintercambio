import { useState } from 'react'
import { useAlbumData } from '../../hooks/useAlbumData'
import type { StickerStatus } from '../../hooks/useUserStickers'

interface FilterViewProps {
  stickers: {
    getStatus: (code: string) => StickerStatus | null
    getDuplicateCount: (code: string) => number
  }
}

const TYPE_ICONS: Record<string, string> = {
  badge: '🛡️',
  team_photo: '📸',
  player: '👤',
}

export function FilterView({ stickers }: FilterViewProps) {
  const album = useAlbumData()
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(['owned', 'missing', 'duplicate']))
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(['badge', 'team_photo', 'player']))

  const toggleStatus = (s: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }

  const toggleType = (t: string) => {
    setTypeFilter((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
  }

  const allCountries = [...album.teams].sort((a, b) => a.team.name.localeCompare(b.team.name)).map((t) => t.team)

  const counts = (() => {
    let owned = 0; let missing = 0; let duplicate = 0; let unmarked = 0
    album.allStickers.forEach((s) => {
      const st = stickers.getStatus(s.code)
      if (st === 'owned') owned++
      else if (st === 'missing') missing++
      else if (st === 'duplicate') duplicate++
      else unmarked++
    })
    return { owned, missing, duplicate, unmarked }
  })()

  const filteredStickers = album.allStickers.filter((s) => {
    if (selectedCountry !== 'all' && s.teamCode !== selectedCountry) return false
    const status = stickers.getStatus(s.code) || 'missing'
    if (!statusFilter.has(status)) return false
    if (!typeFilter.has(s.type)) return false
    return true
  })

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCountry('all')}
          className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            selectedCountry === 'all'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {allCountries.map((t) => (
          <button
            key={t.code}
            onClick={() => setSelectedCountry(t.code)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
              selectedCountry === t.code
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.code}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-2 flex-wrap">
        <span className="text-[10px] font-semibold text-gray-400 self-center mr-1">Estado:</span>
        {[
          { key: 'owned', label: 'Tengo', count: counts.owned, color: 'bg-green-100 text-green-700 border-green-300' },
          { key: 'missing', label: 'Me Faltan', count: counts.missing + counts.unmarked, color: 'bg-orange-100 text-orange-700 border-orange-300' },
          { key: 'duplicate', label: 'Repetidas', count: counts.duplicate, color: 'bg-blue-100 text-blue-700 border-blue-300' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => toggleStatus(key)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition active:scale-95 ${
              statusFilter.has(key) ? color : 'bg-white text-gray-300 border-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        <span className="text-[10px] font-semibold text-gray-400 self-center mr-1">Tipo:</span>
        {[
          { key: 'badge', label: 'Escudos' },
          { key: 'team_photo', label: 'Equipo Completo' },
          { key: 'player', label: 'Jugadores' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleType(key)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition active:scale-95 ${
              typeFilter.has(key)
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-white text-gray-300 border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-[11px] text-gray-400 mb-2">
        {filteredStickers.length} figurita{filteredStickers.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {filteredStickers.map((sticker) => {
          const status = stickers.getStatus(sticker.code)
          const dupCount = stickers.getDuplicateCount(sticker.code)
          const isOwned = status === 'owned'
          const isDupe = status === 'duplicate'

          return (
            <div
              key={sticker.code}
              className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 ${
                isOwned
                  ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/20'
                  : isDupe
                    ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-400/20'
                    : 'border-orange-300 bg-orange-50'
              }`}
            >
              {isDupe && dupCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white font-black min-w-[22px] h-[22px] rounded-full flex items-center justify-center leading-none shadow-lg z-10 px-0.5 border-2 border-white text-xs">
                  {dupCount}
                </div>
              )}
              {isOwned && (
                <div className="absolute top-0.5 right-0.5 bg-green-500 text-white w-[20px] h-[20px] rounded-full flex items-center justify-center font-black shadow-md z-10 text-[11px]">
                  &#10003;
                </div>
              )}
              <span className="text-lg leading-none mb-0.5">{TYPE_ICONS[sticker.type] || '👤'}</span>
              <span className={`text-sm font-black leading-tight ${isOwned ? 'text-green-600' : isDupe ? 'text-blue-500' : 'text-gray-700'}`}>
                {sticker.position}
              </span>
              <span className="text-[7px] text-gray-400 font-mono mt-0.5">{sticker.code}</span>
            </div>
          )
        })}
      </div>

      {filteredStickers.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🔍</p>
          <p>No hay figuritas con los filtros seleccionados</p>
        </div>
      )}
    </div>
  )
}
