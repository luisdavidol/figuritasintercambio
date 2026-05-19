import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function LoginForm() {
  const { login, register, loading, error, setError } = useAuth()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pin.trim()) return
    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 digitos')
      return
    }
    if (isRegister) {
      await register(name, pin)
    } else {
      await login(name, pin)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-xl font-bold text-gray-800">
            Figuritas Mundial 2026
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN (4+ digitos)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Ingresa tu PIN"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || pin.length < 4}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          {isRegister ? (
            <>
              Ya tienes cuenta?{' '}
              <button
                onClick={() => { setIsRegister(false); setError(null) }}
                className="text-blue-600 font-medium"
              >
                Inicia sesion
              </button>
            </>
          ) : (
            <>
              Eres nuevo?{' '}
              <button
                onClick={() => { setIsRegister(true); setError(null) }}
                className="text-blue-600 font-medium"
              >
                Registrate
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
