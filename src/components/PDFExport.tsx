'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Activity = {
    id: string
    title: string
    startTime: string
    endTime: string
    categoryId: string
    completed: boolean
}

type DaySchedule = {
    date: Date
    activities: Activity[]
}

type Category = {
    id: string
    name: string
    color: string
}

type PDFExportProps = {
    week: DaySchedule[]
    categories: Category[]
}

export default function PDFExport({ week, categories }: PDFExportProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            // TODO: Implémenter l'export PDF avec une bibliothèque comme jsPDF
            // 1. Créer un nouveau document PDF
            // 2. Ajouter le titre et la date de la semaine
            // 3. Pour chaque jour :
            //    - Ajouter le nom du jour
            //    - Lister les activités avec leurs horaires et catégories
            // 4. Ajouter les statistiques de la semaine
            // 5. Télécharger le PDF

            const startDate = week[0].date
            const endDate = week[week.length - 1].date
            const fileName = `planning-${format(startDate, 'dd-MM-yyyy')}-au-${format(
                endDate,
                'dd-MM-yyyy'
            )}.pdf`

            // Simulation du temps de génération
            await new Promise((resolve) => setTimeout(resolve, 1000))

            console.log('Export PDF:', fileName)
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
        </button>
    )
} 