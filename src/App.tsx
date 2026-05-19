import { useState, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useAlbumData } from './hooks/useAlbumData'
import { useUserStickers } from './hooks/useUserStickers'
import { Dashboard } from './components/dashboard/Dashboard'
import { MatchFinder } from './components/matches/MatchFinder'
import { AdminPanel } from './components/admin/AdminPanel'

function LoginScreen({
  onLogin,
  onRegister,
  error,
  loading,
}: {
  onLogin: (name: string, pin: string) => void
  onRegister: (name: string, pin: string) => void
  error: string | null
  loading: boolean
}) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pin) return
    isRegister ? onRegister(name, pin) : onLogin(name, pin)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-600 to-green-800 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-white drop-shadow-lg">
            Mundial 2026
          </h1>
          <p className="text-green-200 mt-1 text-sm">Album de Figuritas</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              PIN (4 digitos)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center bg-red-50 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || pin.length < 4}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cargando...
              </span>
            ) : isRegister ? (
              'Registrarse'
            ) : (
              'Iniciar Sesion'
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            {isRegister ? 'Ya tienes cuenta? ' : 'Eres nuevo? '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-green-600 font-semibold hover:underline"
            >
              {isRegister ? 'Iniciar Sesion' : 'Registrarse'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

type Tab = 'album' | 'intercambios' | 'usuarios' | 'admin'

const TYPE_ICONS: Record<string, string> = {
  badge: '🛡️',
  team_photo: '📸',
  player: '👤',
}

function AlbumTabContent({
  stickers,
  album,
  onStickerCycle,
  onStickerDecrement,
}: {
  stickers: ReturnType<typeof useUserStickers>
  album: ReturnType<typeof useAlbumData>
  onStickerCycle: (code: string) => void
  onStickerDecrement: (code: string) => void
}) {
  const [selectedTeamCode, setSelectedTeamCode] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(['owned', 'missing', 'duplicate']))
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(['badge', 'team_photo', 'player']))
  const [showImage, setShowImage] = useState(true)
  const [countrySearch, setCountrySearch] = useState('')

  const allTeams = useCallback(() => {
    return [...album.teams].sort((a, b) => a.team.code.localeCompare(b.team.code))
  }, [album.teams])

  const sortedTeams = allTeams()

  const filteredTeams = countrySearch
    ? sortedTeams.filter((t) =>
        t.team.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        t.team.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : sortedTeams

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

  const counts = (() => {
    let owned = 0; let missing = 0; let duplicate = 0
    album.allStickers.forEach((s) => {
      const st = stickers.getStatus(s.code)
      if (st === 'owned') owned++
      else if (st === 'duplicate') duplicate++
      else missing++
    })
    return { owned, missing, duplicate }
  })()

  const countryStickers = selectedTeamCode === 'all'
    ? album.allStickers
    : album.allStickers.filter((s) => s.teamCode === selectedTeamCode)

  const filteredStickers = countryStickers.filter((s) => {
    const status = stickers.getStatus(s.code) || 'missing'
    if (!statusFilter.has(status)) return false
    if (!typeFilter.has(s.type)) return false
    return true
  })

  const selectedTeam = selectedTeamCode !== 'all' ? album.getTeamByCode(selectedTeamCode) : null
  const hasStatusFilter = statusFilter.size < 3
  const hasTypeFilter = typeFilter.size < 3
  const hasAnyFilter = hasStatusFilter || hasTypeFilter || selectedTeamCode === 'all'
  const showAlbumView = !hasAnyFilter && selectedTeam !== null

  const teamStats = (() => {
    if (!selectedTeam) return { owned: 0, dupes: 0, total: 0 }
    let owned = 0
    let dupes = 0
    const total = selectedTeam.stickers.length
    selectedTeam.stickers.forEach((s) => {
      const st = stickers.getStatus(s.code)
      if (st === 'owned') owned++
      if (st === 'duplicate') dupes++
    })
    return { owned, dupes, total }
  })()

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          placeholder="Buscar pais..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setSelectedTeamCode('all')}
          className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            selectedTeamCode === 'all'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {filteredTeams.map((t) => (
          <button
            key={t.team.code}
            onClick={() => setSelectedTeamCode(t.team.code)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
              selectedTeamCode === t.team.code
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.team.code}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-2 flex-wrap items-center">
        <span className="text-[10px] font-semibold text-gray-400 mr-1">Estado:</span>
        {[
          { key: 'owned', label: 'Tengo', count: counts.owned, color: 'bg-green-100 text-green-700 border-green-300' },
          { key: 'missing', label: 'Me Faltan', count: counts.missing, color: 'bg-orange-100 text-orange-700 border-orange-300' },
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

      <div className="flex gap-1.5 mb-3 flex-wrap items-center">
        <span className="text-[10px] font-semibold text-gray-400 mr-1">Tipo:</span>
        {[
          { key: 'badge', label: 'Escudos' },
          { key: 'team_photo', label: 'Eq. Completo' },
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

      {showAlbumView && selectedTeam ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                {selectedTeam.team.name}
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">
                {selectedTeam.team.code} &middot; Grupo {selectedTeam.team.group} &middot; {selectedTeam.team.federation}
              </p>
            </div>
            <span className="text-[11px] text-gray-400 font-semibold shrink-0">
              {teamStats.owned}/{teamStats.total} &middot; {teamStats.dupes} rep
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
                  src={`/teams/${selectedTeam.team.code}.jpeg`}
                  alt={`Album ${selectedTeam.team.name}`}
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
              Figuritas ({selectedTeam.stickers.length})
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {selectedTeam.stickers.map((sticker) => {
                const status = stickers.getStatus(sticker.code)
                const dupCount = stickers.getDuplicateCount(sticker.code)
                const isOwned = status === 'owned'
                const isDupe = status === 'duplicate'
                const config = { badge: 'bg-amber-50 border-amber-400', team_photo: 'bg-purple-50 border-purple-400', player: 'bg-blue-50 border-blue-400' } as Record<string, string>

                return (
                  <button
                    key={sticker.code}
                    onClick={() => onStickerCycle(sticker.code)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (isDupe || isOwned) onStickerDecrement(sticker.code)
                    }}
                    className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 transition-all duration-150 select-none active:scale-95 overflow-hidden ${config[sticker.type] || config.player} ${
                      isOwned
                        ? 'border-green-500 shadow-md shadow-green-500/20'
                        : isDupe
                          ? 'border-blue-400 shadow-md shadow-blue-400/20'
                          : 'border-gray-300 hover:shadow-md'
                    }`}
                    title={`${sticker.code} | ${sticker.name} | ${sticker.teamName}${isDupe ? ' | Click derecho para reducir' : ''}`}
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
                    <span className="text-[8px] leading-tight text-gray-500 font-semibold text-center px-0.5 mt-0.5 line-clamp-2">
                      {sticker.name}
                    </span>
                    <span className="text-[7px] text-gray-400 font-mono mt-0.5">
                      {sticker.code}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium">
            Toca para marcar &middot; Click derecho / mantener para reducir repetidas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {filteredStickers.map((sticker) => {
            const status = stickers.getStatus(sticker.code)
            const dupCount = stickers.getDuplicateCount(sticker.code)
            const isOwned = status === 'owned'
            const isDupe = status === 'duplicate'

            return (
              <button
                key={sticker.code}
                onClick={() => onStickerCycle(sticker.code)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  if (isDupe || isOwned) onStickerDecrement(sticker.code)
                }}
                className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 transition-all duration-150 select-none active:scale-95 overflow-hidden ${
                  isOwned
                    ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/20'
                    : isDupe
                      ? 'border-blue-400 bg-blue-50 shadow-md shadow-blue-400/20'
                      : 'border-orange-300 bg-orange-50'
                }`}
                title={`${sticker.code} | ${sticker.name} | ${sticker.teamName}${isDupe ? ' | Click derecho para reducir' : ''}`}
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
                <span className="text-[8px] leading-tight text-gray-500 font-semibold text-center px-0.5 mt-0.5 line-clamp-2">
                  {sticker.name}
                </span>
                <span className="text-[7px] text-gray-400 font-mono mt-0.5">{sticker.code}</span>
              </button>
            )
          })}
        </div>
      )}

      {filteredStickers.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🔍</p>
          <p>No hay figuritas con los filtros seleccionados</p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const album = useAlbumData()
  const stickers = useUserStickers(auth.user)
  const [tab, setTab] = useState<Tab>('album')

  const handleLogin = useCallback(
    (name: string, pin: string) => auth.login(name, pin),
    [auth.login]
  )

  const handleRegister = useCallback(
    (name: string, pin: string) => auth.register(name, pin),
    [auth.register]
  )

  const handleStickerCycle = useCallback(
    (code: string) => {
      const current = stickers.getStatus(code)
      if (!current || current === 'missing') {
        stickers.setStickerStatus(code, 'owned')
      } else if (current === 'owned') {
        stickers.setStickerStatus(code, 'duplicate', 1)
      } else if (current === 'duplicate') {
        const count = stickers.getDuplicateCount(code)
        if (count >= 5) {
          stickers.setStickerStatus(code, 'missing')
        } else {
          stickers.setStickerStatus(code, 'duplicate', count + 1)
        }
      }
    },
    [stickers]
  )

  const handleStickerDecrement = useCallback(
    (code: string) => {
      const current = stickers.getStatus(code)
      if (current === 'duplicate') {
        const count = stickers.getDuplicateCount(code)
        if (count <= 1) {
          stickers.setStickerStatus(code, 'owned')
        } else {
          stickers.setStickerStatus(code, 'duplicate', count - 1)
        }
      } else if (current === 'owned') {
        stickers.setStickerStatus(code, 'missing')
      }
    },
    [stickers]
  )

  if (auth.loading || stickers.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={auth.error}
        loading={auth.loading}
      />
    )
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'album', label: 'Album', icon: '📒' },
    { key: 'intercambios', label: 'Intercambios', icon: '🤝' },
    { key: 'usuarios', label: 'Usuarios', icon: '👥' },
    { key: 'admin', label: 'Admin', icon: '⚙️' },
  ]

  const owned = stickers.stats.owned
  const totalDupes = stickers.stats.totalDuplicates
  const totalStickers = album.allStickers.length
  const missing = totalStickers - owned - totalDupes

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-base font-black text-gray-800">
                ⚽ Album {auth.user.name}
              </h1>
            </div>
            <button
              onClick={auth.logout}
              className="text-[11px] text-gray-400 hover:text-red-500 font-semibold transition"
            >
              Salir
            </button>
          </div>
          <div className="flex gap-3 text-[11px] font-semibold flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-owned" />
              <span>{owned}</span>
              <span className="text-gray-400">tengo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-duplicate" />
              <span>{totalDupes}</span>
              <span className="text-gray-400">repes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span>{Math.max(0, missing)}</span>
              <span className="text-gray-400">faltan</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">{totalStickers} total</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-3 pt-3">
        {tab === 'album' && (
          <AlbumTabContent
            stickers={stickers}
            album={album}
            onStickerCycle={handleStickerCycle}
            onStickerDecrement={handleStickerDecrement}
          />
        )}
        {tab === 'intercambios' && <MatchFinder currentUser={auth.user} />}
        {tab === 'usuarios' && <Dashboard currentUser={auth.user} />}
        {tab === 'admin' && <AdminPanel />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center py-2 text-[11px] font-semibold transition ${
                tab === t.key
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
