'use client'

import { useState, useEffect } from 'react'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'

type Activity = {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    completed: boolean
}

type NotificationsProps = {
    activities: Activity[]
}

export default function Notifications({ activities }: NotificationsProps) {
    const [isEnabled, setIsEnabled] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('Votre navigateur ne supporte pas les notifications')
            return
        }

        try {
            const result = await Notification.requestPermission()
            setPermission(result)
            if (result === 'granted') {
                setIsEnabled(true)
                new Notification('Notifications activées', {
                    body: 'Vous recevrez des notifications pour vos activités à venir',
                })
            }
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error)
        }
    }

    useEffect(() => {
        if (!isEnabled || !activities.length) return

        // Vérifier les activités à venir toutes les minutes
        const interval = setInterval(() => {
            const now = new Date()
            const upcoming = activities.filter((activity) => {
                if (activity.completed) return false

                const [hours, minutes] = activity.startTime.split(':')
                const activityTime = new Date()
                activityTime.setHours(parseInt(hours, 10))
                activityTime.setMinutes(parseInt(minutes, 10))

                // Notifier 15 minutes avant
                const diff = activityTime.getTime() - now.getTime()
                return diff > 0 && diff <= 15 * 60 * 1000
            })

            upcoming.forEach((activity) => {
                if (permission === 'granted') {
                    new Notification(`Activité à venir: ${activity.title}`, {
                        body: `Commence à ${activity.startTime}`,
                        icon: '/icon.png', // TODO: Ajouter une icône
                    })
                }
            })
        }, 60000)

        return () => clearInterval(interval)
    }, [isEnabled, activities, permission])

    return (
        <button
            onClick={() => {
                if (permission === 'granted') {
                    setIsEnabled(!isEnabled)
                } else {
                    requestPermission()
                }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
            {isEnabled ? (
                <>
                    <BellIcon className="w-5 h-5" />
                    Notifications activées
                </>
            ) : (
                <>
                    <BellSlashIcon className="w-5 h-5" />
                    Activer les notifications
                </>
            )}
        </button>
    )
} 