import { useMemo, useState, useCallback } from 'react'
import { useAllUsers } from '../../hooks/useAuth'
import { useAllUserStickers } from '../../hooks/useUserStickers'
import { useCatalog } from '../../hooks/useCatalog'
import { findMatches, executeExchange } from '../../lib/matchEngine'
import type { User } from '../../hooks/useAuth'

interface Props {
  currentUser: User
}

interface MatchUI {
  otherUser: User
  iGive: { code: string; number: number; country: string }[]
  iReceive: { code: string; number: number; country: string }[]
}

export function MatchFinder({ currentUser }: Props) {
  const { users, loading: usersLoading } = useAllUsers()
  const { allStickers, loading: stickersLoading } = useAllUserStickers(users)
  const { catalog } = useCatalog()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedGive, setSelectedGive] = useState<Map<string, Set<string>>>(new Map())
  const [selectedReceive, setSelectedReceive] = useState<Map<string, Set<string>>>(new Map())
  const [executing, setExecuting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const catalogCodes = useMemo(() => catalog.map((c) => c.code), [catalog])

  const codeToInfo = useMemo(() => {
    const map = new Map<string, (typeof catalog)[0]>()
    catalog.forEach((c) => map.set(c.code, c))
    return map
  }, [catalog])

  const rawMatches = useMemo(() => {
    return findMatches(currentUser, users, allStickers, catalogCodes)
  }, [currentUser, users, allStickers, catalogCodes])

  const matches: MatchUI[] = useMemo(() => {
    return rawMatches.map((m) => ({
      otherUser: m.otherUser,
      iGive: m.iGive.map((code) => {
        const info = codeToInfo.get(code)
        return { code, number: info?.position || 0, country: info?.country || '' }
      }),
      iReceive: m.iReceive.map((code) => {
        const info = codeToInfo.get(code)
        return { code, number: info?.position || 0, country: info?.country || '' }
      }),
    }))
  }, [rawMatches, codeToInfo])

  const toggleExpanded = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId); else next.add(userId)
      return next
    })
  }

  const toggleSelect = (
    userId: string,
    code: string,
    side: 'give' | 'receive'
  ) => {
    const setter = side === 'give' ? setSelectedGive : setSelectedReceive
    setter((prev) => {
      const next = new Map(prev)
      const current = new Set(next.get(userId) || [])
      if (current.has(code)) current.delete(code); else current.add(code)
      if (current.size === 0) next.delete(userId); else next.set(userId, current)
      return next
    })
  }

  const selectAll = (
    userId: string,
    side: 'give' | 'receive',
    all: string[]
  ) => {
    const setter = side === 'give' ? setSelectedGive : setSelectedReceive
    setter((prev) => {
      const next = new Map(prev)
      next.set(userId, new Set(all))
      return next
    })
  }

  const handleExchange = useCallback(
    async (otherUserId: string, iGive: string[], iReceive: string[], otherName: string) => {
      setExecuting(otherUserId)
      try {
        await executeExchange(currentUser.id, otherUserId, iGive, iReceive, allStickers)
        setSelectedGive((prev) => { const n = new Map(prev); n.delete(otherUserId); return n })
        setSelectedReceive((prev) => { const n = new Map(prev); n.delete(otherUserId); return n })
        setToast(`Intercambio con ${otherName}: ${iGive.length} ↔ ${iReceive.length} completado`)
        setTimeout(() => setToast(null), 4000)
      } catch (e: any) {
        alert('Error: ' + (e.message || 'Error al intercambiar'))
      } finally {
        setExecuting(null)
      }
    },
    [currentUser.id, allStickers]
  )

  const StickerChip = ({
    code,
    number,
    country,
    selected,
    onToggle,
    disabled,
  }: {
    code: string
    number: number
    country: string
    selected: boolean
    onToggle: () => void
    disabled?: boolean
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition border ${
        selected
          ? 'bg-green-100 border-green-400 text-green-800'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="font-mono font-bold">#{number}</span>
      <span className="text-[10px] text-gray-400 font-mono">{code}</span>
      <span className="text-[9px] text-gray-400 ml-0.5 truncate max-w-16">{country}</span>
    </button>
  )

  if (usersLoading || stickersLoading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-green-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Oportunidades de Intercambio</h2>

      {toast && (
        <div className="bg-green-100 border border-green-300 text-green-800 text-xs font-semibold px-3 py-2 rounded-lg animate-pulse">
          {toast}
        </div>
      )}

      {users.length <= 1 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-sm">Solo estas tu registrado.</p>
          <p className="text-xs mt-1">Invita a otros a registrarse y marcar sus figuritas para encontrar intercambios.</p>
        </div>
      )}

      {users.length > 1 && matches.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🤝</p>
          <p className="text-sm">No hay coincidencias todavia.</p>
          <p className="text-xs mt-1">Registra tus figuritas repetidas para encontrar intercambios.</p>
        </div>
      )}

      {matches.map((match) => {
        const uid = match.otherUser.id
        const isOpen = expanded.has(uid)
        const selGive = selectedGive.get(uid) || new Set<string>()
        const selReceive = selectedReceive.get(uid) || new Set<string>()
        const selGiveCount = selGive.size
        const selReceiveCount = selReceive.size
        const balanced = selGiveCount === selReceiveCount && selGiveCount > 0

        const giveAll = match.iGive.map((s) => s.code)
        const receiveAll = match.iReceive.map((s) => s.code)

        const isOneToOne = match.iGive.length === 1 && match.iReceive.length === 1
        const hasBoth = match.iGive.length > 0 && match.iReceive.length > 0
        const onlyGive = match.iGive.length > 0 && match.iReceive.length === 0
        const onlyReceive = match.iGive.length === 0 && match.iReceive.length > 0

        return (
          <div
            key={uid}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleExpanded(uid)}
              className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                {match.otherUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm">{match.otherUser.name}</span>
                <div className="text-[10px] text-gray-400 truncate">
                  {match.iGive.length > 0 && `${match.iGive.length} para dar`}
                  {match.iGive.length > 0 && match.iReceive.length > 0 && ' · '}
                  {match.iReceive.length > 0 && `${match.iReceive.length} para recibir`}
                </div>
              </div>
              <span className="text-gray-300 text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                {isOneToOne && (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <span className="text-xs font-bold text-green-700">Intercambio 1:1</span>
                    </div>

                    <div className="text-[10px] font-semibold text-gray-400 uppercase">Recibis de {match.otherUser.name}:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.iReceive.map((s) => (
                        <StickerChip key={`r-${s.code}`} {...s} selected={true} onToggle={() => {}} disabled />
                      ))}
                    </div>

                    <div className="text-[10px] font-semibold text-gray-400 uppercase">Das a {match.otherUser.name}:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.iGive.map((s) => (
                        <StickerChip key={`g-${s.code}`} {...s} selected={true} onToggle={() => {}} disabled />
                      ))}
                    </div>

                    <button
                      onClick={() => handleExchange(uid, giveAll, receiveAll, match.otherUser.name)}
                      disabled={executing === uid}
                      className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {executing === uid ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Intercambiando...
                        </span>
                      ) : (
                        'Intercambiar 1:1'
                      )}
                    </button>
                  </>
                )}

                {hasBoth && !isOneToOne && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">
                        Elegi las figuritas para intercambiar
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        balanced ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selReceiveCount} ↔ {selGiveCount}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-blue-600 uppercase">
                          Recibis de {match.otherUser.name}:
                        </span>
                        <button
                          onClick={() => selectAll(uid, 'receive', receiveAll)}
                          className="text-[9px] text-blue-500 hover:underline"
                        >
                          Todas
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.iReceive.map((s) => (
                          <StickerChip
                            key={`r-${s.code}`}
                            {...s}
                            selected={selReceive.has(s.code)}
                            onToggle={() => toggleSelect(uid, s.code, 'receive')}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-purple-600 uppercase">
                          Das a {match.otherUser.name}:
                        </span>
                        <button
                          onClick={() => selectAll(uid, 'give', giveAll)}
                          className="text-[9px] text-purple-500 hover:underline"
                        >
                          Todas
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.iGive.map((s) => (
                          <StickerChip
                            key={`g-${s.code}`}
                            {...s}
                            selected={selGive.has(s.code)}
                            onToggle={() => toggleSelect(uid, s.code, 'give')}
                          />
                        ))}
                      </div>
                    </div>

                    {!balanced && (selGiveCount > 0 || selReceiveCount > 0) && (
                      <p className="text-[10px] text-orange-500 text-center">
                        Debes seleccionar la misma cantidad en ambos lados
                      </p>
                    )}

                    <button
                      onClick={() =>
                        handleExchange(
                          uid,
                          Array.from(selGive),
                          Array.from(selReceive),
                          match.otherUser.name
                        )
                      }
                      disabled={!balanced || executing === uid}
                      className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {executing === uid ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Intercambiando...
                        </span>
                      ) : (
                        `Intercambiar (${selGiveCount} ↔ ${selReceiveCount})`
                      )}
                    </button>
                  </>
                )}

                {onlyGive && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      Repetidas que le sirven a {match.otherUser.name}:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.iGive.map((s) => (
                        <StickerChip key={`g-${s.code}`} {...s} selected={false} onToggle={() => {}} disabled />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">
                      {match.otherUser.name} no tiene repetidas que te sirvan. Solo podes regalarle.
                    </p>
                    <button
                      onClick={() => handleExchange(uid, giveAll, [], match.otherUser.name)}
                      disabled={executing === uid}
                      className="w-full py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                    >
                      {executing === uid ? 'Regalando...' : `Regular a ${match.otherUser.name} (${giveAll.length})`}
                    </button>
                  </div>
                )}

                {onlyReceive && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      Repetidas de {match.otherUser.name} que te sirven:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.iReceive.map((s) => (
                        <StickerChip key={`r-${s.code}`} {...s} selected={false} onToggle={() => {}} disabled />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">
                      No tenes repetidas que le sirvan a {match.otherUser.name}. Pedile que te regale.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
