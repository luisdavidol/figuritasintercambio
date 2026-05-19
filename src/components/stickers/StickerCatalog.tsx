import { useCatalog } from '../../hooks/useCatalog'
import { useUserStickers } from '../../hooks/useUserStickers'
import type { User } from '../../hooks/useAuth'

interface Props {
  currentUser: User
}

export function StickerCatalog({ currentUser }: Props) {
  const {
    filtered,
    countries,
    search,
    setSearch,
    selectedCountry,
    setSelectedCountry,
  } = useCatalog()
  const { getStatus, getDuplicateCount } = useUserStickers(currentUser)

  const statusColor = (code: string) => {
    const s = getStatus(code)
    if (!s) return 'bg-gray-100 text-gray-600'
    if (s === 'owned') return 'bg-green-100 text-green-700 border-green-300'
    if (s === 'duplicate') return 'bg-blue-100 text-blue-700 border-blue-300'
    if (s === 'missing') return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-gray-100 text-gray-600'
  }

  const statusIcon = (code: string) => {
    const s = getStatus(code)
    if (!s) return ''
    if (s === 'owned') return '✓'
    if (s === 'duplicate') return `×${getDuplicateCount(code)}`
    if (s === 'missing') return '−'
    return ''
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por numero, codigo o pais..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
        />
        <select
          value={selectedCountry || ''}
          onChange={(e) => setSelectedCountry(e.target.value || null)}
          className="px-3 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[140px]"
        >
          <option value="">Todos</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {filtered.map((sticker) => {
          const st = getStatus(sticker.code)
          return (
            <button
              key={sticker.code}
              className={`relative flex flex-col items-center p-2 rounded-lg border text-xs transition-all active:scale-95 ${statusColor(sticker.code)}`}
              title={`${sticker.code} - ${sticker.country}${sticker.playerName ? ` - ${sticker.playerName}` : ''}`}
            >
              <span className="font-bold text-xs">{sticker.position}</span>
              <span className="text-[10px] leading-tight text-center mt-0.5 opacity-70">
                {sticker.country.length > 10 ? sticker.country.slice(0, 10) + '..' : sticker.country}
              </span>
              {st && <span className="text-[10px] font-bold mt-0.5">{statusIcon(sticker.code)}</span>}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🔍</p>
          <p>No se encontraron figuritas</p>
        </div>
      )}
    </div>
  )
}
