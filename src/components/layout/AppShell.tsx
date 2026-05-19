import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { TabBar } from './TabBar'
import { StickerCatalog } from '../stickers/StickerCatalog'
import { StickerInput } from '../stickers/StickerInput'
import { MyCollection } from '../stickers/MyCollection'
import { Dashboard } from '../dashboard/Dashboard'
import { MatchFinder } from '../matches/MatchFinder'

interface Props {
  currentUser: NonNullable<ReturnType<typeof useAuth>['user']>
  onLogout: () => void
}

export function AppShell({ currentUser, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('input')

  const renderTab = () => {
    switch (activeTab) {
      case 'catalog':
        return <StickerCatalog currentUser={currentUser} />
      case 'input':
        return <StickerInput currentUser={currentUser} />
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />
      case 'matches':
        return <MatchFinder currentUser={currentUser} />
      case 'collection':
        return <MyCollection currentUser={currentUser} />
      default:
        return <StickerInput currentUser={currentUser} />
    }
  }

  const tabTitles: Record<string, string> = {
    catalog: 'Album',
    input: 'Cargar Figuritas',
    dashboard: 'Grupo',
    matches: 'Intercambios',
    collection: 'Mi Coleccion',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 safe-area-top">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-800">{tabTitles[activeTab]}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{currentUser.name}</span>
            <button
              onClick={onLogout}
              className="text-xs text-red-500 font-medium hover:text-red-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {renderTab()}
      </main>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
