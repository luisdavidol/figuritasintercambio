import { useState, useCallback, useMemo } from 'react'
import { useAllUsers } from '../../hooks/useAuth'
import { useAllUserStickers } from '../../hooks/useUserStickers'
import { useCatalog } from '../../hooks/useCatalog'
import { findMatchesBetween, executeExchange } from '../../lib/matchEngine'

function StickerTag({ code, info }: { code: string; info: { position: number; code: string } | undefined }) {
  return (
    <span className="inline-flex items-center bg-purple-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
      #{info?.position || '?'} <span className="text-gray-400 ml-0.5">{code}</span>
    </span>
  )
}

export function AdminPanel() {
  const { users, loading: usersLoading } = useAllUsers()
  const { allStickers, loading: stickersLoading } = useAllUserStickers(users)
  const { catalog } = useCatalog()
  const [userA, setUserA] = useState('')
  const [userB, setUserB] = useState('')
  const [executing, setExecuting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const catalogCodes = useMemo(() => catalog.map((c) => c.code), [catalog])

  const codeToInfo = useMemo(() => {
    const map = new Map<string, (typeof catalog)[0]>()
    catalog.forEach((c) => map.set(c.code, c))
    return map
  }, [catalog])

  const userStickers = useMemo(() => {
    const map = new Map<string, { owned: number; dupes: number; dupUnits: number }>()
    users.forEach((u) => {
      let owned = 0
      let dupes = 0
      let dupUnits = 0
      allStickers.forEach((s) => {
        if (s.userId !== u.id) return
        if (s.status === 'owned') owned++
        if (s.status === 'duplicate') {
          dupes++
          dupUnits += s.duplicateCount
        }
      })
      map.set(u.id, { owned, dupes, dupUnits })
    })
    return map
  }, [users, allStickers])

  const match = useMemo(() => {
    if (!userA || !userB || userA === userB) return null
    return findMatchesBetween(userA, userB, allStickers, catalogCodes)
  }, [userA, userB, allStickers, catalogCodes])

  const { balanced, aExcess, bExcess, balancedCount } = useMemo(() => {
    if (!match) return { balanced: null, aExcess: [], bExcess: [], balancedCount: 0 }
    const count = Math.min(match.aGivesB.length, match.bGivesA.length)
    const aBal = match.aGivesB.slice(0, count)
    const bBal = match.bGivesA.slice(0, count)
    const aExc = match.aGivesB.slice(count)
    const bExc = match.bGivesA.slice(count)
    return {
      balanced: { aGivesB: aBal, bGivesA: bBal },
      aExcess: aExc,
      bExcess: bExc,
      balancedCount: count,
    }
  }, [match])

  const usersWithStats = useMemo(() => {
    return users.map((u) => {
      const stats = userStickers.get(u.id)
      const pct = catalog.length > 0 ? Math.round(((stats?.owned || 0) / catalog.length) * 100) : 0
      return { ...u, ...stats, pct }
    })
  }, [users, userStickers, catalog.length])

  const handleExchange = useCallback(async () => {
    if (!balanced || balancedCount === 0 || !userA || !userB) return
    setExecuting(true)
    try {
      await executeExchange(userA, userB, balanced.aGivesB, balanced.bGivesA, allStickers)
      setConfirming(false)
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Error al intercambiar'))
    } finally {
      setExecuting(false)
    }
  }, [balanced, balancedCount, userA, userB, allStickers])

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

  const userAName = users.find((u) => u.id === userA)?.name || ''
  const userBName = users.find((u) => u.id === userB)?.name || ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Admin - Gestion de Intercambios</h2>
        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
          ADMIN
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Usuarios Registrados
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {usersWithStats.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                  {u.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-gray-700">{u.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-green-600 font-semibold">{u.owned}</span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-600 font-semibold">{u.dupUnits} rep</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">{u.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Seleccionar Usuarios para Intercambio
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
              Usuario A
            </label>
            <select
              value={userA}
              onChange={(e) => setUserA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Seleccionar...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} disabled={u.id === userB}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
              Usuario B
            </label>
            <select
              value={userB}
              onChange={(e) => setUserB(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Seleccionar...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} disabled={u.id === userA}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {userA && userB && match && (
          <div className="border-t border-gray-100 pt-3">
            {(match.aGivesB.length > 0 || match.bGivesA.length > 0) ? (
              <>
                {balancedCount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-center">
                    <span className="text-xs font-bold text-green-700">
                      Intercambio 1:1 — {balancedCount} figurita{balancedCount > 1 ? 's' : ''} por lado
                    </span>
                  </div>
                )}

                {balancedCount > 0 && balanced && (
                  <>
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-purple-600 mb-1">
                        {userAName} → {userBName} ({balanced.aGivesB.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 bg-purple-50 rounded-lg p-2 max-h-28 overflow-y-auto">
                        {balanced.aGivesB.map((code) => (
                          <StickerTag key={code} code={code} info={codeToInfo.get(code)} />
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs font-semibold text-blue-600 mb-1">
                        {userBName} → {userAName} ({balanced.bGivesA.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 bg-blue-50 rounded-lg p-2 max-h-28 overflow-y-auto">
                        {balanced.bGivesA.map((code) => (
                          <StickerTag key={code} code={code} info={codeToInfo.get(code)} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {aExcess.length > 0 && (
                  <div className="mb-2 opacity-60">
                    <div className="text-[10px] font-semibold text-gray-400 mb-1">
                      Sin pareja: {userAName} tiene {aExcess.length} repetida{aExcess.length > 1 ? 's' : ''} extra
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {aExcess.map((code) => (
                        <StickerTag key={code} code={code} info={codeToInfo.get(code)} />
                      ))}
                    </div>
                  </div>
                )}

                {bExcess.length > 0 && (
                  <div className="mb-3 opacity-60">
                    <div className="text-[10px] font-semibold text-gray-400 mb-1">
                      Sin pareja: {userBName} tiene {bExcess.length} repetida{bExcess.length > 1 ? 's' : ''} extra
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {bExcess.map((code) => (
                        <StickerTag key={code} code={code} info={codeToInfo.get(code)} />
                      ))}
                    </div>
                  </div>
                )}

                {balancedCount > 0 ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition"
                  >
                    Ejecutar Intercambio ({balancedCount} ↔ {balancedCount})
                  </button>
                ) : (
                  <p className="text-center text-xs text-orange-500 bg-orange-50 rounded-lg py-2">
                    Intercambio desbalanceado: {match.aGivesB.length} vs {match.bGivesA.length}. No se puede hacer 1:1.
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-xs text-gray-400 py-3">
                No hay coincidencias entre {userAName} y {userBName}. No tienen repetidas que al otro le falten.
              </p>
            )}
          </div>
        )}

        {userA && userB && userA === userB && (
          <p className="text-center text-xs text-orange-500 py-2">
            Selecciona dos usuarios diferentes.
          </p>
        )}
      </div>

      {confirming && balanced && balancedCount > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Confirmar Intercambio
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Intercambio <strong>1:1</strong> entre{' '}
              <strong>{userAName}</strong> y <strong>{userBName}</strong>:
            </p>

            <div className="mb-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
              {userAName} → {userBName}: {balanced.aGivesB.length} figuritas
            </div>
            <div className="mb-4 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              {userBName} → {userAName}: {balanced.bGivesA.length} figuritas
            </div>

            {aExcess.length > 0 && (
              <p className="text-[10px] text-gray-400 mb-3">
                Quedan {aExcess.length} repetidas de {userAName} sin intercambiar
              </p>
            )}
            {bExcess.length > 0 && (
              <p className="text-[10px] text-gray-400 mb-3">
                Quedan {bExcess.length} repetidas de {userBName} sin intercambiar
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={executing}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleExchange}
                disabled={executing}
                className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition text-sm"
              >
                {executing ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  `Confirmar (${balancedCount} ↔ ${balancedCount})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
