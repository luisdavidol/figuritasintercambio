interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'catalog', label: 'Album', icon: '📖' },
  { id: 'input', label: 'Cargar', icon: '📦' },
  { id: 'dashboard', label: 'Grupo', icon: '👥' },
  { id: 'matches', label: 'Intercambios', icon: '🤝' },
  { id: 'collection', label: 'Mi Perfil', icon: '👤' },
]

export function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
