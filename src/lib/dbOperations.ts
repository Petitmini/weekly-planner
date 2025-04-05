import db from './db'
import { format } from 'date-fns'

export type Category = {
    id: string
    name: string
    color: string
}

export type Activity = {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    completed: boolean
    date: string
}

type DBActivity = {
    id: string
    title: string
    start_time: string
    end_time: string
    category_id: string
    completed: number
    date: string
}

// Fonctions pour les catégories
export const getCategories = (): Category[] => {
    return db.prepare('SELECT * FROM categories').all() as Category[]
}

// Fonctions pour les activités
export const getActivitiesByWeek = (startDate: Date, endDate: Date): Activity[] => {
    const activities = db.prepare(`
        SELECT * FROM activities 
        WHERE date BETWEEN ? AND ?
        ORDER BY start_time
    `).all(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
    ) as DBActivity[]

    return activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        startTime: activity.start_time,
        endTime: activity.end_time,
        categoryId: activity.category_id,
        completed: Boolean(activity.completed),
        date: activity.date
    }))
}

export const addActivity = (activity: Omit<Activity, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const stmt = db.prepare(`
        INSERT INTO activities (id, title, start_time, end_time, category_id, completed, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
        id,
        activity.title,
        activity.startTime,
        activity.endTime,
        activity.categoryId,
        activity.completed ? 1 : 0,
        activity.date
    )

    return id
}

export const updateActivityCompletion = (id: string, completed: boolean) => {
    const stmt = db.prepare(`
        UPDATE activities
        SET completed = ?
        WHERE id = ?
    `)

    stmt.run(completed ? 1 : 0, id)
}

export const deleteActivity = (id: string) => {
    const stmt = db.prepare('DELETE FROM activities WHERE id = ?')
    stmt.run(id)
}

// Fonction utilitaire pour convertir les activités en format adapté pour l'interface
export const groupActivitiesByDay = (activities: Activity[]) => {
    const grouped = new Map<string, Activity[]>()
    
    activities.forEach(activity => {
        const date = activity.date
        if (!grouped.has(date)) {
            grouped.set(date, [])
        }
        grouped.get(date)?.push(activity)
    })

    return grouped
} 