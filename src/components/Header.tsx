'use client'

import { useTheme } from '@/app/providers'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export default function Header() {
    const { theme, toggleTheme } = useTheme()

    return (
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Planning Hebdomadaire
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organisez votre semaine efficacement
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Changer le thème"
                >
                    {theme === 'dark' ? (
                        <SunIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    ) : (
                        <MoonIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    )}
                </button>
            </div>
        </header>
    )
} 