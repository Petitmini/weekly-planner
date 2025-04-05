'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TrashIcon } from '@heroicons/react/24/outline'

interface Activity {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    date: string
    completed: boolean
}

interface Category {
    id: string
    name: string
    color: string
}

interface AddActivityModalProps {
    date: Date
    categories: Category[]
    onClose: () => void
    onAdd: (activity: Omit<Activity, 'id'>) => void
    onEdit?: (activity: Activity) => void
    onDelete?: (id: string) => void
    activity?: Activity
    mode?: 'add' | 'edit'
}

export default function AddActivityModal({
    date,
    categories,
    onClose,
    onAdd,
    onEdit,
    onDelete,
    activity,
    mode = 'add',
}: AddActivityModalProps) {
    const [title, setTitle] = useState(activity?.title || '')
    const [startTime, setStartTime] = useState(activity?.startTime || '09:00')
    const [endTime, setEndTime] = useState(activity?.endTime || '10:00')
    const [categoryId, setCategoryId] = useState(activity?.categoryId || categories[0]?.id || '')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        if (activity) {
            setTitle(activity.title)
            setStartTime(activity.startTime)
            setEndTime(activity.endTime)
            setCategoryId(activity.categoryId)
        }
    }, [activity])

    // Gérer la sélection de catégorie
    const handleCategoryChange = (newCategoryId: string) => {
        setCategoryId(newCategoryId)
        if (newCategoryId === 'sleep' && !title) {
            // Suggestions pour le sommeil
            setTitle('Réveil')
            setStartTime('07:00')
            setEndTime('07:00')
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const activityData = {
            title,
            startTime,
            endTime,
            categoryId,
            date: format(date, 'yyyy-MM-dd'),
            completed: activity?.completed || false,
        }

        if (mode === 'edit' && activity && onEdit) {
            onEdit({ ...activityData, id: activity.id })
        } else {
            onAdd(activityData)
        }
        onClose()
    }

    const handleDelete = () => {
        if (activity && onDelete) {
            onDelete(activity.id)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {mode === 'add' ? 'Ajouter' : 'Modifier'} une activité pour le {format(date, 'EEEE d MMMM', { locale: fr })}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Catégorie
                        </label>
                        <select
                            id="category"
                            value={categoryId}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Titre
                        </label>
                        {categoryId === 'sleep' && mode === 'add' && (
                            <div className="mt-1 mb-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitle('Réveil')
                                        setStartTime('07:00')
                                        setEndTime('07:00')
                                    }}
                                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                                >
                                    Réveil
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitle('Coucher')
                                        setStartTime('22:00')
                                        setEndTime('22:00')
                                    }}
                                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                                >
                                    Coucher
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTitle('Sieste')
                                        setStartTime('14:00')
                                        setEndTime('15:00')
                                    }}
                                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                                >
                                    Sieste
                                </button>
                            </div>
                        )}
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`${(title.toLowerCase() === 'réveil' || title.toLowerCase() === 'coucher') ? 'col-span-2' : 'col-span-1'}`}>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {title.toLowerCase() === 'réveil' ? "Heure de réveil" :
                                    title.toLowerCase() === 'coucher' ? "Heure de coucher" :
                                        "Heure de début"}
                            </label>
                            <input
                                type="time"
                                id="startTime"
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(e.target.value)
                                    // Synchroniser l'heure de fin pour réveil et coucher uniquement
                                    if (title.toLowerCase() === 'réveil' || title.toLowerCase() === 'coucher') {
                                        setEndTime(e.target.value)
                                    }
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        {(title.toLowerCase() !== 'réveil' && title.toLowerCase() !== 'coucher') && (
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Heure de fin
                                </label>
                                <input
                                    type="time"
                                    id="endTime"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {mode === 'add' ? 'Ajouter' : 'Modifier'}
                            </button>
                        </div>
                        {mode === 'edit' && onDelete && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                                {showDeleteConfirm && (
                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-4">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                            Êtes-vous sûr de vouloir supprimer cette activité ?
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
} 