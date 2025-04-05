import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
    try {
        const categories = db.prepare('SELECT * FROM categories').all()
        return NextResponse.json(categories)
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des catégories' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const category = await request.json()
        const id = Math.random().toString(36).substr(2, 9)

        const stmt = db.prepare(`
            INSERT INTO categories (id, name, color)
            VALUES (?, ?, ?)
        `)

        stmt.run(id, category.name, category.color)

        return NextResponse.json({ id })
    } catch (error) {
        return NextResponse.json(
            { error: 'Erreur lors de la création de la catégorie' },
            { status: 500 }
        )
    }
} 