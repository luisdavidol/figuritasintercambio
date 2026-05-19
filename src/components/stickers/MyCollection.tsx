import { useUserStickers } from '../../hooks/useUserStickers'
import { useCatalog } from '../../hooks/useCatalog'
import type { User } from '../../hooks/useAuth'

interface Props {
  currentUser: User
}

export function MyCollection({ currentUser }: Props) {
  const { userStickers, stats } = useUserStickers(currentUser)
  const { catalog } = useCatalog()
  const totalStickers = catalog.length

  const missing = Array.from(userStickers.values()).filter((s) => s.status === 'missing')
  const duplicates = Array.from(userStickers.values()).filter((s) => s.status === 'duplicate')

  const codeToCatalog = new Map(catalog.map((c) => [c.code, c]))

  const pct = totalStickers > 0 ? Math.round((stats.owned / totalStickers) * 100) : 0

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Mi Progreso</h2>
        <div className="bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
          <div
            className="bg-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{pct}% completado</span>
          <span className="text-gray-500">{stats.owned}/{totalStickers}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-2xl font-bold text-green-600">{stats.owned}</div>
            <div className="text-xs text-green-700">Tengo</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDuplicates}</div>
            <div className="text-xs text-blue-700">Repes</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2">
            <div className="text-2xl font-bold text-orange-600">{stats.missing}</div>
            <div className="text-xs text-orange-700">Me faltan</div>
          </div>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Mis Repetidas ({stats.totalDuplicates} unidades)
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {duplicates.map((s) => {
              const info = codeToCatalog.get(s.stickerCode)
              return (
                <div
                  key={s.stickerCode}
                  className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="font-bold text-blue-700">#{info?.position || '?'}</span>
                    <span className="text-sm text-gray-600 ml-2">{info?.country}</span>
                    <span className="text-xs text-gray-400 ml-1">{s.stickerCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      x{s.duplicateCount}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Me Faltan ({stats.missing})
          </h2>
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
            {missing.map((s) => {
              const info = codeToCatalog.get(s.stickerCode)
              return (
                <span
                  key={s.stickerCode}
                  className="inline-flex items-center bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs"
                  title={info?.country}
                >
                  <span className="font-bold">#{info?.position || '?'}</span>
                  <span className="ml-1 opacity-70">{s.stickerCode}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
