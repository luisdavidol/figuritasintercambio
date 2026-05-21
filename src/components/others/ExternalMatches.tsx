import { useState, useMemo, useCallback } from 'react'
import { useExternalReports, type ExternalReport } from '../../hooks/useExternalReports'
import { useCatalog } from '../../hooks/useCatalog'
import { parseExternalReport } from '../../lib/reportParser'
import { findExternalMatches, executeExternalExchange } from '../../lib/externalMatchEngine'
import type { User } from '../../hooks/useAuth'
import type { UserSticker } from '../../hooks/useUserStickers'

interface Props {
  currentUser: User
  userStickers: Map<string, UserSticker>
}

export function ExternalMatches({ currentUser, userStickers }: Props) {
  const { reports, loading, saveReport, updateReport, deleteReport } = useExternalReports(currentUser)
  const { catalog } = useCatalog()
  const [name, setName] = useState('')
  const [rawText, setRawText] = useState('')
  const [parseMsg, setParseMsg] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedGive, setSelectedGive] = useState<Map<string, Set<string>>>(new Map())
  const [selectedReceive, setSelectedReceive] = useState<Map<string, Set<string>>>(new Map())
  const [executing, setExecuting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const codeToInfo = useMemo(() => {
    const map = new Map<string, (typeof catalog)[0]>()
    catalog.forEach((c) => map.set(c.code, c))
    return map
  }, [catalog])

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setParseMsg('Pon un nombre para identificar el reporte (ej: Pacheco).')
      return
    }
    if (!rawText.trim()) {
      setParseMsg('Pega el reporte de la otra app.')
      return
    }
    const parsed = parseExternalReport(rawText)
    if (parsed.missing.length === 0 && parsed.duplicates.length === 0) {
      setParseMsg('No se encontraron figuritas en el reporte. Revisa el formato.')
      return
    }
    if (parsed.parseErrors.length > 0) {
      setParseMsg(`Se guardo con ${parsed.parseErrors.length} advertencia(s): ${parsed.parseErrors.slice(0, 3).join(' | ')}`)
    } else {
      setParseMsg(null)
    }
    saveReport(name.trim(), parsed.missing, parsed.duplicates)
    setName('')
    setRawText('')
  }, [name, rawText, saveReport])

  const toggleExpanded = (reportId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(reportId)) next.delete(reportId); else next.add(reportId)
      return next
    })
  }

  const toggleSelect = (
    reportId: string,
    code: string,
    side: 'give' | 'receive'
  ) => {
    const setter = side === 'give' ? setSelectedGive : setSelectedReceive
    setter((prev) => {
      const next = new Map(prev)
      const current = new Set(next.get(reportId) || [])
      if (current.has(code)) current.delete(code); else current.add(code)
      if (current.size === 0) next.delete(reportId); else next.set(reportId, current)
      return next
    })
  }

  const selectAll = (reportId: string, side: 'give' | 'receive', all: string[]) => {
    const setter = side === 'give' ? setSelectedGive : setSelectedReceive
    setter((prev) => {
      const next = new Map(prev)
      next.set(reportId, new Set(all))
      return next
    })
  }

  const handleExchange = useCallback(
    async (report: ExternalReport, give: string[], receive: string[]) => {
      setExecuting(report.id)
      try {
        await executeExternalExchange(currentUser.id, report, give, receive, userStickers)
        setSelectedGive((prev) => { const n = new Map(prev); n.delete(report.id); return n })
        setSelectedReceive((prev) => { const n = new Map(prev); n.delete(report.id); return n })
        setToast(`Intercambio con ${report.name}: ${give.length} dados, ${receive.length} recibidos`)
        setTimeout(() => setToast(null), 4000)
      } catch (e: any) {
        alert('Error: ' + (e.message || 'Error al intercambiar'))
      } finally {
        setExecuting(null)
      }
    },
    [currentUser.id, userStickers]
  )

  const handleManualRemove = useCallback(
    async (report: ExternalReport, code: string, fromList: 'missing' | 'duplicates') => {
      const updated = { ...report }
      if (fromList === 'missing') {
        updated.missing = report.missing.filter((c) => c !== code)
      } else {
        updated.duplicates = report.duplicates.filter((c) => c !== code)
      }
      await updateReport(updated)
      setToast(`"${code}" removido de ${report.name}`)
      setTimeout(() => setToast(null), 3000)
    },
    [updateReport]
  )

  const matchesByReport = useMemo(() => {
    const map = new Map<string, { iGive: string[]; iReceive: string[] }>()
    reports.forEach((r) => {
      map.set(r.id, findExternalMatches(userStickers, r))
    })
    return map
  }, [reports, userStickers])

  const StickerChip = ({
    code,
    selected,
    onToggle,
    disabled,
    onRemove,
  }: {
    code: string
    selected: boolean
    onToggle: () => void
    disabled?: boolean
    onRemove?: () => void
  }) => {
    const info = codeToInfo.get(code)
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition border ${
            selected
              ? 'bg-green-100 border-green-400 text-green-800'
              : disabled
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-default'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
          } ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="font-mono font-bold">{info ? `#${info.position}` : '?'}</span>
          <span className="text-[10px] text-gray-400 font-mono">{code}</span>
          <span className="text-[9px] text-gray-400 ml-0.5 truncate max-w-16">{info?.country || ''}</span>
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-[10px] text-red-400 hover:text-red-600 font-bold px-1"
            title={`Marcar ${code} como intercambiado`}
          >
            ✕
          </button>
        )}
      </span>
    )
  }

  if (loading) {
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
      <h2 className="text-lg font-bold text-gray-800">Reportes de Otras Apps</h2>

      {toast && (
        <div className="bg-green-100 border border-green-300 text-green-800 text-xs font-semibold px-3 py-2 rounded-lg animate-pulse">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Nuevo Reporte
        </h3>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
            Nombre (ej: Pacheco)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del amigo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">
            Reporte (pega el texto)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Me faltan\nMEX: 13\nSUI: 12\n...\n\nRepetidas\nFWC: 2\nRSA: 11, 20\n...`}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-400 font-mono resize-y"
          />
        </div>
        {parseMsg && (
          <p className={`text-[10px] px-2 py-1 rounded ${parseMsg.includes('advertencia') || parseMsg.includes('error') ? 'bg-yellow-50 text-yellow-700' : 'bg-orange-50 text-orange-600'}`}>
            {parseMsg}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={!name.trim() || !rawText.trim()}
          className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Guardar Reporte
        </button>
      </div>

      {reports.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No hay reportes guardados.</p>
          <p className="text-xs mt-1">Pega el reporte de otra app para encontrar matches.</p>
        </div>
      )}

      {reports.map((report) => {
        const isOpen = expanded.has(report.id)
        const match = matchesByReport.get(report.id) || { iGive: [], iReceive: [] }
        const selGive = selectedGive.get(report.id) || new Set<string>()
        const selReceive = selectedReceive.get(report.id) || new Set<string>()
        const selGiveCount = selGive.size
        const selReceiveCount = selReceive.size
        const balanced = selGiveCount === selReceiveCount && selGiveCount > 0

        const isOneToOne = match.iGive.length === 1 && match.iReceive.length === 1
        const hasBoth = match.iGive.length > 0 && match.iReceive.length > 0
        const onlyGive = match.iGive.length > 0 && match.iReceive.length === 0
        const onlyReceive = match.iGive.length === 0 && match.iReceive.length > 0
        const hasMatch = match.iGive.length > 0 || match.iReceive.length > 0

        return (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggleExpanded(report.id)}
              className="w-full flex items-center gap-2 p-4 hover:bg-gray-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                {report.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm">{report.name}</span>
                <div className="text-[10px] text-gray-400 truncate">
                  {report.missing.length} faltan · {report.duplicates.length} repetidas
                  {hasMatch && (
                    <span className="text-green-600 font-semibold ml-2">
                      ({match.iGive.length} dar / {match.iReceive.length} recibir)
                    </span>
                  )}
                </div>
              </div>
              <span className="text-gray-300 text-sm shrink-0">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <div className="flex gap-4 text-[10px] text-gray-500">
                  <span className="font-semibold text-orange-600">{report.missing.length} faltan</span>
                  <span className="font-semibold text-blue-600">{report.duplicates.length} repetidas</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">{report.missing.length + report.duplicates.length} stickers</span>
                </div>

                {hasMatch ? (
                  <>
                    {isOneToOne && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <span className="text-xs font-bold text-green-700">Intercambio 1:1 con {report.name}</span>
                      </div>
                    )}

                    {hasBoth && !isOneToOne && (
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
                    )}

                    {match.iGive.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-purple-600 uppercase">
                            Das a {report.name} ({match.iGive.length}):
                          </span>
                          {!isOneToOne && (
                            <button
                              onClick={() => selectAll(report.id, 'give', match.iGive)}
                              className="text-[9px] text-purple-500 hover:underline"
                            >
                              Todas
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.iGive.map((code) => (
                            <StickerChip
                              key={`g-${code}`}
                              code={code}
                              selected={isOneToOne || selGive.has(code)}
                              onToggle={() => toggleSelect(report.id, code, 'give')}
                              disabled={isOneToOne}
                              onRemove={isOneToOne ? undefined : () => handleManualRemove(report, code, 'missing')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {match.iReceive.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-blue-600 uppercase">
                            Recibes de {report.name} ({match.iReceive.length}):
                          </span>
                          {!isOneToOne && (
                            <button
                              onClick={() => selectAll(report.id, 'receive', match.iReceive)}
                              className="text-[9px] text-blue-500 hover:underline"
                            >
                              Todas
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {match.iReceive.map((code) => (
                            <StickerChip
                              key={`r-${code}`}
                              code={code}
                              selected={isOneToOne || selReceive.has(code)}
                              onToggle={() => toggleSelect(report.id, code, 'receive')}
                              disabled={isOneToOne}
                              onRemove={isOneToOne ? undefined : () => handleManualRemove(report, code, 'duplicates')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {hasBoth && !isOneToOne && !balanced && (selGiveCount > 0 || selReceiveCount > 0) && (
                      <p className="text-[10px] text-orange-500 text-center">
                        Debes seleccionar la misma cantidad en ambos lados
                      </p>
                    )}

                    {onlyGive && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-gray-400 text-center">
                          {report.name} no tiene repetidas que te sirvan. Solo puedes regalarle.
                        </p>
                        <button
                          onClick={() => handleExchange(report, match.iGive, [])}
                          disabled={executing === report.id}
                          className="w-full py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                          {executing === report.id ? 'Regalando...' : `Regular a ${report.name} (${match.iGive.length})`}
                        </button>
                      </div>
                    )}

                    {onlyReceive && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-gray-400 text-center">
                          No tenes repetidas que le sirvan a {report.name}.
                        </p>
                      </div>
                    )}

                    {(!onlyGive || !onlyReceive) && (isOneToOne || hasBoth) && (
                      <button
                        onClick={() =>
                          handleExchange(
                            report,
                            isOneToOne ? match.iGive : Array.from(selGive),
                            isOneToOne ? match.iReceive : Array.from(selReceive)
                          )
                        }
                        disabled={!isOneToOne && (!balanced || executing === report.id)}
                        className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {executing === report.id ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Intercambiando...
                          </span>
                        ) : isOneToOne ? (
                          'Intercambiar 1:1'
                        ) : (
                          `Intercambiar (${selGiveCount} ↔ ${selReceiveCount})`
                        )}
                      </button>
                    )}

                    {!isOneToOne && (
                      <p className="text-[9px] text-gray-400 text-center">
                        Usa ✕ en cada figurita para quitarla manualmente del reporte
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Sin coincidencias con tu album. Registra tus figuritas repetidas y faltantes.
                  </p>
                )}

                {report.missing.length > 0 && !hasMatch && (
                  <details className="text-[10px] text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-600">
                      Ver {report.missing.length} faltantes de {report.name}
                    </summary>
                    <div className="flex flex-wrap gap-0.5 mt-1 max-h-32 overflow-y-auto">
                      {report.missing.map((code) => (
                        <span key={code} className="inline-flex items-center px-1.5 py-0.5 bg-orange-50 rounded text-[10px] font-mono">
                          {code}
                          <button
                            onClick={() => handleManualRemove(report, code, 'missing')}
                            className="ml-1 text-red-400 hover:text-red-600"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </details>
                )}

                {report.duplicates.length > 0 && !hasMatch && (
                  <details className="text-[10px] text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-600">
                      Ver {report.duplicates.length} repetidas de {report.name}
                    </summary>
                    <div className="flex flex-wrap gap-0.5 mt-1 max-h-32 overflow-y-auto">
                      {report.duplicates.map((code) => (
                        <span key={code} className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 rounded text-[10px] font-mono">
                          {code}
                          <button
                            onClick={() => handleManualRemove(report, code, 'duplicates')}
                            className="ml-1 text-red-400 hover:text-red-600"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </details>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setConfirmDelete(report.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 font-semibold transition"
                  >
                    Eliminar reporte
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Eliminar reporte?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esto elimina permanentemente el reporte y sus datos.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteReport(confirmDelete)
                  setConfirmDelete(null)
                  setExpanded((prev) => { const n = new Set(prev); n.delete(confirmDelete); return n })
                }}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
