'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PlusIcon, ChartBarIcon, PencilIcon } from '@heroicons/react/24/outline'
import AddActivityModal from './AddActivityModal'
import Statistics from './Statistics'

interface Activity {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    completed: boolean
    date: string
}

interface Category {
    id: string
    name: string
    color: string
}

export default function WeeklyPlanner() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showStats, setShowStats] = useState(false)
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const startDate = startOfWeek(new Date(), { locale: fr })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                await fetchCategories()
                await fetchActivities()
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            if (!response.ok) throw new Error('Erreur lors de la récupération des catégories')
            const data = await response.json()
            setCategories(data)
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error)
            throw error
        }
    }

    const fetchActivities = async () => {
        try {
            const startDateStr = format(startDate, 'yyyy-MM-dd')
            const endDateStr = format(addDays(startDate, 6), 'yyyy-MM-dd')
            const response = await fetch(`/api/activities?startDate=${startDateStr}&endDate=${endDateStr}`)
            if (!response.ok) throw new Error('Erreur lors de la récupération des activités')
            const data = await response.json()
            setActivities(data)
        } catch (error) {
            console.error('Erreur lors de la récupération des activités:', error)
            throw error
        }
    }

    const handleEditActivity = async (activity: Activity) => {
        try {
            const response = await fetch('/api/activities', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activity),
            })

            if (!response.ok) {
                throw new Error('Erreur lors de la modification de l\'activité')
            }

            setActivities(prevActivities =>
                prevActivities.map(a => a.id === activity.id ? activity : a)
            )
            setEditingActivity(null)
            setIsModalOpen(false)
        } catch (error) {
            console.error('Erreur:', error)
            alert('Une erreur est survenue lors de la modification de l\'activité')
        }
    }

    const handleDeleteActivity = async (id: string) => {
        try {
            const response = await fetch('/api/activities', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            })

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de l\'activité')
            }

            setActivities(activities.filter(a => a.id !== id))
            setIsModalOpen(false)
            setEditingActivity(null)
        } catch (error) {
            console.error('Erreur:', error)
            alert('Une erreur est survenue lors de la suppression de l\'activité')
        }
    }

    const handleAddActivity = async (activity: Omit<Activity, 'id'>) => {
        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activity),
            })
            if (!response.ok) throw new Error('Erreur lors de l\'ajout de l\'activité')

            const data = await response.json()
            if (data.id) {
                setActivities(prevActivities => [...prevActivities, { ...activity, id: data.id }])
                setIsModalOpen(false)
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'activité:', error)
            alert('Erreur lors de l\'ajout de l\'activité')
        }
    }

    const toggleActivityCompletion = async (activity: Activity) => {
        try {
            const response = await fetch('/api/activities', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: activity.id,
                    completed: !activity.completed,
                }),
            })
            if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'activité')

            setActivities(prevActivities =>
                prevActivities.map(a =>
                    a.id === activity.id ? { ...a, completed: !a.completed } : a
                )
            )
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'activité:', error)
            alert('Erreur lors de la mise à jour de l\'activité')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                </div>
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ChartBarIcon className="w-5 h-5" />
                    {showStats ? 'Masquer les statistiques' : 'Voir les statistiques'}
                </button>
            </div>

            {showStats && (
                <Statistics activities={activities} categories={categories} />
            )}

            <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day) => (
                    <div key={day.toString()} className="border dark:border-gray-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            {format(day, 'EEEE d', { locale: fr })}
                        </h3>
                        <button
                            onClick={() => {
                                setSelectedDate(day)
                                setEditingActivity(null)
                                setIsModalOpen(true)
                            }}
                            className="mb-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            +
                        </button>
                        <div className="space-y-2">
                            {activities
                                .filter(activity => activity.date === format(day, 'yyyy-MM-dd'))
                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                .map(activity => (
                                    <div
                                        key={activity.id}
                                        className="p-2 rounded relative group"
                                        style={{
                                            backgroundColor: categories.find(c => c.id === activity.categoryId)?.color + '40'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={activity.completed}
                                                onChange={() => toggleActivityCompletion(activity)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`text-sm ${activity.completed ? 'line-through' : ''}`}>
                                                {activity.title}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setEditingActivity(activity)
                                                    setSelectedDate(parseISO(activity.date))
                                                    setIsModalOpen(true)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {activity.startTime} - {activity.endTime}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && selectedDate && (
                <AddActivityModal
                    date={selectedDate}
                    categories={categories}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingActivity(null)
                    }}
                    onAdd={handleAddActivity}
                    onEdit={handleEditActivity}
                    onDelete={handleDeleteActivity}
                    activity={editingActivity || undefined}
                    mode={editingActivity ? 'edit' : 'add'}
                />
            )}
        </div>
    )
} 