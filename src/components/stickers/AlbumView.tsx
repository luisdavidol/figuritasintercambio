import { useState } from 'react'
import type { AlbumTeam, StickerInfo } from '../../hooks/useAlbumData'
import type { StickerStatus } from '../../hooks/useUserStickers'

interface AlbumViewProps {
  team: AlbumTeam
  stickers: {
    getStatus: (code: string) => StickerStatus | null
    getDuplicateCount: (code: string) => number
  }
  onStickerCycle: (code: string) => void
  stats: { owned: number; dupes: number; total: number }
}

const TYPE_CONFIG: Record<string, { icon: string; bg: string; border: string }> = {
  badge: { icon: '🛡️', bg: 'bg-amber-50', border: 'border-amber-400' },
  team_photo: { icon: '📸', bg: 'bg-purple-50', border: 'border-purple-400' },
  player: { icon: '👤', bg: 'bg-blue-50', border: 'border-blue-400' },
}

function StickerSlot({
  sticker,
  status,
  dupCount,
  onCycle,
}: {
  sticker: StickerInfo
  status: StickerStatus | null
  dupCount: number
  onCycle: () => void
}) {
  const config = TYPE_CONFIG[sticker.type] || TYPE_CONFIG.player
  const isOwned = status === 'owned'
  const isDupe = status === 'duplicate'

  return (
    <button
      onClick={onCycle}
      className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 transition-all duration-150 select-none active:scale-95 overflow-hidden ${config.bg} ${
        isOwned
          ? 'border-owned shadow-md shadow-owned/20'
          : isDupe
            ? 'border-duplicate shadow-md shadow-duplicate/20'
            : `${config.border} hover:shadow-md`
      }`}
      title={`${sticker.code} | ${sticker.name} | ${sticker.teamName}`}
    >
      {isDupe && dupCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 bg-duplicate text-white font-black min-w-[22px] h-[22px] rounded-full flex items-center justify-center leading-none shadow-lg z-10 px-0.5 border-2 border-white text-xs">
          {dupCount}
        </div>
      )}

      {isOwned && (
        <div className="absolute top-0.5 right-0.5 bg-owned text-white w-[20px] h-[20px] rounded-full flex items-center justify-center font-black shadow-md z-10 text-[11px]">
          &#10003;
        </div>
      )}

      <span className="text-lg leading-none mb-0.5">{config.icon}</span>

      <span className={`text-sm font-black leading-tight ${isOwned ? 'text-owned' : isDupe ? 'text-duplicate' : 'text-gray-700'}`}>
        {sticker.position}
      </span>

      <span className="text-[8px] leading-tight text-gray-500 font-semibold text-center px-0.5 mt-0.5 line-clamp-2">
        {sticker.name}
      </span>

      <span className="text-[7px] text-gray-400 font-mono mt-0.5">
        {sticker.code}
      </span>
    </button>
  )
}

export function AlbumView({ team, stickers, onStickerCycle, stats }: AlbumViewProps) {
  const [showImage, setShowImage] = useState(true)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
            {team.team.name}
          </h2>
          <p className="text-[10px] text-gray-400 font-medium">
            {team.team.code} &middot; Grupo {team.team.group} &middot; {team.team.federation}
          </p>
        </div>
        <span className="text-[11px] text-gray-400 font-semibold shrink-0">
          {stats.owned}/{stats.total} &middot; {stats.dupes} rep
        </span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => setShowImage(!showImage)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-200 transition active:scale-[0.98]"
        >
          <span>{showImage ? 'Ocultar pagina del album' : 'Mostrar pagina del album'}</span>
          <span className="text-gray-400">{showImage ? '▲' : '▼'}</span>
        </button>

        {showImage && (
          <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 bg-white">
            <img
              src={`/teams/${team.team.code}.jpeg`}
              alt={`Album ${team.team.name}`}
              className="w-full h-auto block"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Figuritas ({stats.total})
        </h3>
        <div className="grid grid-cols-5 gap-1.5">
          {team.stickers.map((sticker) => (
            <StickerSlot
              key={sticker.code}
              sticker={sticker}
              status={stickers.getStatus(sticker.code)}
              dupCount={stickers.getDuplicateCount(sticker.code)}
              onCycle={() => onStickerCycle(sticker.code)}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium">
        Toca una figurita para marcar como conseguida &middot; vuelve a tocar para repetida
      </p>
    </div>
  )
}
