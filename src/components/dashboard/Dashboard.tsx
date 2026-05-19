import { useMemo } from 'react'
import { useAllUsers, type User } from '../../hooks/useAuth'
import { useAllUserStickers } from '../../hooks/useUserStickers'
import { useCatalog } from '../../hooks/useCatalog'
import type { User as UserType } from '../../hooks/useAuth'

interface Props {
  currentUser: UserType
}

export function Dashboard({ currentUser }: Props) {
  const { users } = useAllUsers()
  const { allStickers } = useAllUserStickers(users)
  const { catalog } = useCatalog()
  const totalStickers = catalog.length

  const userStats = useMemo(() => {
    return users.map((u) => {
      let owned = 0
      let duplicates = 0
      let missing = 0
      let dupUnits = 0

      allStickers.forEach((s) => {
        if (s.userId !== u.id) return
        if (s.status === 'owned') owned++
        if (s.status === 'missing') missing++
        if (s.status === 'duplicate') {
          duplicates++
          dupUnits += s.duplicateCount
        }
      })

      return {
        user: u,
        owned,
        duplicates,
        missing,
        dupUnits,
        pct: totalStickers > 0 ? Math.round((owned / totalStickers) * 100) : 0,
      }
    })
  }, [users, allStickers, totalStickers])

  const isMe = (u: User) => u.id === currentUser.id

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Grupo ({users.length})</h2>

      {userStats.map(({ user, owned, missing, dupUnits, pct }) => (
        <div
          key={user.id}
          className={`bg-white rounded-xl shadow-sm border p-4 ${
            isMe(user) ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-gray-800">{user.name}</span>
                {isMe(user) && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Tu</span>
                )}
              </div>
            </div>
            <span className="text-lg font-bold text-gray-700">{pct}%</span>
          </div>

          <div className="bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {owned}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {dupUnits} repes
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {missing} faltan
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
