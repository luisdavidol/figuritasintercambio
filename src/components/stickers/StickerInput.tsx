import { useState } from 'react'
import { useUserStickers } from '../../hooks/useUserStickers'
import { useCatalog, type StickerInfo } from '../../hooks/useCatalog'
import type { User } from '../../hooks/useAuth'

interface Props {
  currentUser: User
}

export function StickerInput({ currentUser }: Props) {
  const { setStickerStatus, getStatus, getDuplicateCount, bulkSetStatus } =
    useUserStickers(currentUser)
  const { findByCode, findByNumber } = useCatalog()
  const [input, setInput] = useState('')
  const [lastSticker, setLastSticker] = useState<StickerInfo | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkNums, setBulkNums] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const code = input.trim().toUpperCase()
    const sticker = findByCode(code) || (Number(code) ? findByNumber(Number(code)) : null)

    if (!sticker) {
      setLastSticker(null)
      return
    }

    setLastSticker(sticker)
    setInput('')
  }

  const handleStatus = async (status: 'owned' | 'missing' | 'duplicate') => {
    if (!lastSticker) return
    if (status === 'duplicate') {
      const current = getDuplicateCount(lastSticker.code)
      await setStickerStatus(lastSticker.code, 'duplicate', current + 1)
    } else {
      await setStickerStatus(lastSticker.code, status)
    }
    setLastSticker(null)
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkNums.trim()) return

    const codes = bulkNums
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const sticker = findByCode(c.toUpperCase()) || findByNumber(Number(c))
        return sticker?.code
      })
      .filter(Boolean) as string[]

    if (codes.length > 0) {
      await bulkSetStatus(codes, 'owned')
      setBulkNums('')
    }
  }

  const statusButtons = () => {
    if (!lastSticker) return null
    const currentStatus = getStatus(lastSticker.code)
    const dupCount = getDuplicateCount(lastSticker.code)

    return (
      <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center mb-3">
          <span className="text-3xl font-bold text-blue-600">#{lastSticker.position}</span>
          <span className="text-xs text-gray-400 ml-2">{lastSticker.code}</span>
          <p className="text-lg font-semibold text-gray-800">{lastSticker.country}</p>
          <p className="text-sm text-gray-500">
            {lastSticker.type === 'escudo' ? 'Escudo' : lastSticker.type === 'especial' ? 'Especial' : 'Jugador'}
            {currentStatus && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                Actual: {currentStatus === 'duplicate' ? `Repetida x${dupCount}` : currentStatus === 'owned' ? 'La tengo' : 'Me falta'}
              </span>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleStatus('owned')}
            className="py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all"
          >
            La tengo
          </button>
          <button
            onClick={() => handleStatus('duplicate')}
            className="py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all"
          >
            Repetida
            {dupCount > 0 && <span className="ml-1 bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs">{dupCount}</span>}
          </button>
          <button
            onClick={() => handleStatus('missing')}
            className="py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all"
          >
            Me falta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setBulkMode(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            !bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Una por una
        </button>
        <button
          onClick={() => setBulkMode(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Por paquete
        </button>
      </div>

      {!bulkMode ? (
        <>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Numero o codigo (ej: 87 o ARG10)"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center"
                autoFocus
              />
            </div>
          </form>
          {statusButtons()}
        </>
      ) : (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <textarea
            value={bulkNums}
            onChange={(e) => setBulkNums(e.target.value)}
            placeholder="Pega los 7 numeros del paquete, separados por coma o espacio&#10;Ej: 12, 45, 78, 103, 200, 341, 500"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
            rows={4}
            autoFocus
          />
          <button
            type="submit"
            disabled={!bulkNums.trim()}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            Marcar todas como "Las tengo"
          </button>
          <p className="text-xs text-gray-400 text-center">
            Esto marca todas las figuritas del paquete como que ya las tienes.
            Si alguna es repetida, despues la editas manualmente.
          </p>
        </form>
      )}

      {!lastSticker && !bulkMode && (
        <div className="mt-8 text-center text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-sm">Ingresa un numero o codigo de figurita para empezar</p>
        </div>
      )}
    </div>
  )
}
