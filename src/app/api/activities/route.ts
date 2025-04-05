import { NextResponse } from 'next/server'
import db from '@/lib/db'

interface DBActivity {
    id: string
    title: string
    start_time: string
    end_time: string
    category_id: string
    completed: number
    date: string
}

interface Activity {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    completed: boolean
    date: string
}

function mapDBActivityToActivity(dbActivity: DBActivity): Activity {
    return {
        id: dbActivity.id,
        title: dbActivity.title,
        startTime: dbActivity.start_time,
        endTime: dbActivity.end_time,
        categoryId: dbActivity.category_id,
        completed: dbActivity.completed === 1,
        date: dbActivity.date
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
        return NextResponse.json(
            { error: 'Les dates de début et de fin sont requises' },
            { status: 400 }
        )
    }

    try {
        const dbActivities = db.prepare(`
            SELECT * FROM activities 
            WHERE date BETWEEN ? AND ?
            ORDER BY start_time
        `).all(startDate, endDate) as DBActivity[]

        const activities = dbActivities.map(mapDBActivityToActivity)
        return NextResponse.json(activities)
    } catch (error) {
        console.error('Erreur base de données:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des activités' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const activity: Omit<Activity, 'id'> = await request.json()
        const id = Math.random().toString(36).substr(2, 9)

        const stmt = db.prepare(`
            INSERT INTO activities (id, title, start_time, end_time, category_id, completed, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

        const result = stmt.run(
            id,
            activity.title,
            activity.startTime,
            activity.endTime,
            activity.categoryId,
            activity.completed ? 1 : 0,
            activity.date
        )

        if (result.changes === 0) {
            throw new Error('Échec de l\'insertion')
        }

        return NextResponse.json({ id })
    } catch (error) {
        console.error('Erreur base de données:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la création de l\'activité' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const activity: Activity = await request.json()

        const stmt = db.prepare(`
            UPDATE activities
            SET title = ?,
                start_time = ?,
                end_time = ?,
                category_id = ?,
                completed = ?,
                date = ?
            WHERE id = ?
        `)

        const result = stmt.run(
            activity.title,
            activity.startTime,
            activity.endTime,
            activity.categoryId,
            activity.completed ? 1 : 0,
            activity.date,
            activity.id
        )

        if (result.changes === 0) {
            return NextResponse.json(
                { error: 'Activité non trouvée' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur base de données:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la modification de l\'activité' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, completed } = await request.json()

        const stmt = db.prepare(`
            UPDATE activities
            SET completed = ?
            WHERE id = ?
        `)

        const result = stmt.run(completed ? 1 : 0, id)

        if (result.changes === 0) {
            return NextResponse.json(
                { error: 'Activité non trouvée' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur base de données:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'activité' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json()

        const stmt = db.prepare(`
            DELETE FROM activities
            WHERE id = ?
        `)

        const result = stmt.run(id)

        if (result.changes === 0) {
            return NextResponse.json(
                { error: 'Activité non trouvée' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur base de données:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l\'activité' },
            { status: 500 }
        )
    }
} 