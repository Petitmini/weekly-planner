import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

// Vérifier que nous sommes côté serveur
if (typeof window === 'undefined') {
    const dbPath = path.join(process.cwd(), 'planner.db')
    db = new Database(dbPath)

    // Créer les tables si elles n'existent pas
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            category_id TEXT,
            completed INTEGER DEFAULT 0,
            date TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
    `)
}

// Insertion des catégories par défaut si elles n'existent pas
const defaultCategories = [
    { id: 'work', name: 'Travail', color: 'bg-blue-500' },
    { id: 'sport', name: 'Sport', color: 'bg-green-500' },
    { id: 'leisure', name: 'Loisirs', color: 'bg-purple-500' },
    { id: 'family', name: 'Famille', color: 'bg-red-500' },
    { id: 'sleep', name: 'Sommeil', color: 'bg-black-500' }
]

const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, color)
    VALUES (@id, @name, @color)
`)

defaultCategories.forEach((category) => {
    insertCategory.run(category)
})

export default db 