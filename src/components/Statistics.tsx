'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
    ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import { useState, useMemo } from 'react'
import { format, parseISO, differenceInMinutes, addDays, set, startOfMonth, endOfMonth, isSameMonth, subMonths, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    ChartLegend,
    ArcElement
)

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

interface CategoryStats {
    category: Category
    totalActivities: number
    completedActivities: number
    completionRate: number
    totalMinutes: number
    completedMinutes: number
    averageSleepTime?: number
}

interface SleepPeriod {
    date: string
    bedTime?: string
    wakeTime?: string
}

interface StatisticsProps {
    activities: Activity[]
    categories: Category[]
}

const getBackgroundColor = (color: string, opacity: number) => {
    return color.replace('bg-', 'rgba(')
        .replace('-500', `, ${opacity})`)
        .replace('blue', '59, 130, 246')
        .replace('green', '34, 197, 94')
        .replace('purple', '168, 85, 247')
        .replace('red', '239, 68, 68')
        .replace('indigo', '99, 102, 241')
}

const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    const difference = current - previous
    const threshold = 0.1 // 10% de différence pour considérer un changement
    if (Math.abs(difference) / previous < threshold) return 'stable'
    return difference > 0 ? 'up' : 'down'
}

const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
}

const TrendIndicator = ({ trend, className = "" }: { trend: 'up' | 'down' | 'stable', className?: string }) => {
    const baseClasses = `h-5 w-5 ${className}`
    switch (trend) {
        case 'up':
            return <ArrowUpIcon className={`${baseClasses} text-green-500`} />
        case 'down':
            return <ArrowDownIcon className={`${baseClasses} text-red-500`} />
        default:
            return <MinusIcon className={`${baseClasses} text-gray-500`} />
    }
}

export default function Statistics({ activities, categories }: StatisticsProps) {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
    const [activeTab, setActiveTab] = useState<'general' | 'progression'>('general')

    const stats = useMemo<CategoryStats[]>(() => {
        const categoryStats = categories.map(category => {
            const categoryActivities = activities.filter(activity => activity.categoryId === category.id)
            const totalActivities = categoryActivities.length
            const completedActivities = categoryActivities.filter(activity => activity.completed).length
            const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

            // Calcul du temps total pour chaque catégorie
            const totalMinutes = categoryActivities.reduce((acc, activity) => {
                if (category.id === 'sleep') {
                    return acc // Le temps de sommeil est calculé séparément
                } else {
                    const start = parseISO(`${activity.date}T${activity.startTime}`)
                    const end = parseISO(`${activity.date}T${activity.endTime}`)
                    return acc + differenceInMinutes(end, start)
                }
            }, 0)

            // Calcul du temps des activités complétées
            const completedMinutes = categoryActivities.reduce((acc, activity) => {
                if (!activity.completed) {
                    return acc
                }

                if (category.id === 'sleep') {
                    const date = parseISO(activity.date)
                    const midnight = set(date, { hours: 0, minutes: 0 })
                    const nextMidnight = set(addDays(date, 1), { hours: 0, minutes: 0 })

                    if (activity.title.toLowerCase().includes('réveil')) {
                        const wakeTime = parseISO(`${activity.date}T${activity.startTime}`)
                        return acc + differenceInMinutes(wakeTime, midnight)
                    } else if (activity.title.toLowerCase().includes('coucher')) {
                        const bedTime = parseISO(`${activity.date}T${activity.startTime}`)
                        return acc + differenceInMinutes(nextMidnight, bedTime)
                    } else if (activity.title.toLowerCase().includes('sieste')) {
                        const start = parseISO(`${activity.date}T${activity.startTime}`)
                        const end = parseISO(`${activity.date}T${activity.endTime}`)
                        return acc + differenceInMinutes(end, start)
                    }
                    return acc
                } else {
                    const start = parseISO(`${activity.date}T${activity.startTime}`)
                    const end = parseISO(`${activity.date}T${activity.endTime}`)
                    return acc + differenceInMinutes(end, start)
                }
            }, 0)

            return {
                category,
                totalActivities,
                completedActivities,
                completionRate,
                totalMinutes,
                completedMinutes
            }
        })

        // Calcul spécifique pour le sommeil
        const sleepCategory = categories.find(c => c.id === 'sleep')
        if (sleepCategory) {
            const sleepActivities = activities.filter(activity => activity.categoryId === 'sleep')

            // Organiser les activités de sommeil par date
            const sleepPeriods = sleepActivities.reduce((acc: { [key: string]: { date: string, events: { title: string, time: string, endTime?: string }[] } }, activity) => {
                const date = activity.date
                if (!acc[date]) {
                    acc[date] = { date, events: [] }
                }

                if (activity.title.toLowerCase().includes('sieste')) {
                    acc[date].events.push({
                        title: activity.title.toLowerCase(),
                        time: activity.startTime,
                        endTime: activity.endTime
                    })
                } else {
                    acc[date].events.push({
                        title: activity.title.toLowerCase(),
                        time: activity.startTime
                    })
                }

                return acc
            }, {})

            let totalSleepMinutes = 0
            let validSleepPeriods = 0

            // Calculer le temps de sommeil pour chaque période
            Object.values(sleepPeriods).forEach(period => {
                const date = parseISO(period.date)
                const midnight = set(date, { hours: 0, minutes: 0 })
                const nextMidnight = set(addDays(date, 1), { hours: 0, minutes: 0 })

                // Trier les événements par heure
                const sortedEvents = period.events.sort((a, b) => a.time.localeCompare(b.time))
                let dailySleepMinutes = 0

                // Trouver tous les réveils et couchers
                const wakeEvents = sortedEvents.filter(e => e.title.includes('réveil'))
                const bedEvents = sortedEvents.filter(e => e.title.includes('coucher'))

                // Traiter les périodes de sommeil
                let lastWakeTime: Date | null = null

                // Traiter chaque réveil
                for (let i = 0; i < wakeEvents.length; i++) {
                    const wakeEvent = wakeEvents[i]
                    const wakeTime = parseISO(`${period.date}T${wakeEvent.time}`)

                    // Chercher le dernier coucher avant ce réveil
                    const previousBed = [...bedEvents]
                        .reverse()
                        .find(b => b.time < wakeEvent.time)

                    if (previousBed) {
                        // Si on trouve un coucher précédent dans la même journée
                        const bedTime = parseISO(`${period.date}T${previousBed.time}`)
                        dailySleepMinutes += differenceInMinutes(wakeTime, bedTime)
                    } else {
                        // Si pas de coucher précédent, on compte depuis minuit
                        // mais seulement si on n'a pas déjà compté une période qui inclut minuit
                        if (!lastWakeTime || lastWakeTime < midnight) {
                            dailySleepMinutes += differenceInMinutes(wakeTime, midnight)
                        }
                    }

                    lastWakeTime = wakeTime
                }

                // Traiter le dernier coucher s'il n'est pas suivi d'un réveil
                const lastBed = bedEvents[bedEvents.length - 1]
                if (lastBed) {
                    const lastBedTime = parseISO(`${period.date}T${lastBed.time}`)
                    const nextWake = wakeEvents.find(w => w.time > lastBed.time)

                    if (!nextWake) {
                        // Si pas de réveil après, on compte jusqu'à minuit
                        dailySleepMinutes += differenceInMinutes(nextMidnight, lastBedTime)
                    }
                }

                // Ajouter les siestes
                const napEvents = sortedEvents.filter(e => e.title.includes('sieste'))
                napEvents.forEach(nap => {
                    if (nap.endTime) {
                        const napStart = parseISO(`${period.date}T${nap.time}`)
                        const napEnd = parseISO(`${period.date}T${nap.endTime}`)
                        dailySleepMinutes += differenceInMinutes(napEnd, napStart)
                    }
                })

                if (dailySleepMinutes > 0) {
                    totalSleepMinutes += dailySleepMinutes
                    validSleepPeriods++
                }
            })

            const sleepIndex = categoryStats.findIndex(s => s.category.id === 'sleep')
            if (sleepIndex !== -1) {
                categoryStats[sleepIndex].totalMinutes = totalSleepMinutes
                categoryStats[sleepIndex].averageSleepTime = validSleepPeriods > 0 ?
                    totalSleepMinutes / validSleepPeriods : 0
            }
        }

        return categoryStats
    }, [activities, categories])

    const barChartData = {
        labels: categories.map((cat) => cat.name),
        datasets: [
            {
                label: 'Temps prévu (heures)',
                data: stats.map((stat) => +(stat.totalMinutes / 60).toFixed(1)),
                backgroundColor: categories.map((cat) => getBackgroundColor(cat.color, 0.3)),
                borderWidth: 0,
                order: 0,
            },
            {
                label: 'Temps effectué (heures)',
                data: stats.map((stat) => {
                    const completed = +(stat.completedMinutes || 0) / 60
                    const total = +(stat.totalMinutes / 60)
                    return +(completed > total ? total : completed).toFixed(1)
                }),
                backgroundColor: categories.map((cat) => getBackgroundColor(cat.color, 0.8)),
                borderWidth: 0,
                order: 0,
            },
        ],
    }

    const pieChartData = {
        labels: categories.map((cat) => cat.name),
        datasets: [
            {
                data: stats.map((stat) => stat.completionRate),
                backgroundColor: categories.map((cat) => getBackgroundColor(cat.color, 0.8)),
            },
        ],
    }

    const progressionData = useMemo(() => {
        const now = new Date()
        const last3Months = Array.from({ length: 3 }, (_, i) => {
            const monthDate = subMonths(now, i)
            const monthStart = startOfMonth(monthDate)
            const monthEnd = endOfMonth(monthDate)

            const monthActivities = activities.filter(activity => {
                const activityDate = parseISO(activity.date)
                return isSameMonth(activityDate, monthDate)
            })

            const completionRate = monthActivities.length > 0
                ? (monthActivities.filter(a => a.completed).length / monthActivities.length) * 100
                : 0

            const categoryTimes = categories.map(category => {
                const categoryActivities = monthActivities.filter(a =>
                    a.categoryId === category.id && a.completed
                )

                let totalMinutes = 0
                categoryActivities.forEach(activity => {
                    if (category.id === 'sleep') {
                        const date = parseISO(activity.date)
                        const midnight = set(date, { hours: 0, minutes: 0 })
                        const nextMidnight = set(addDays(date, 1), { hours: 0, minutes: 0 })

                        if (activity.title.toLowerCase().includes('réveil')) {
                            const wakeTime = parseISO(`${activity.date}T${activity.startTime}`)
                            totalMinutes += differenceInMinutes(wakeTime, midnight)
                        } else if (activity.title.toLowerCase().includes('coucher')) {
                            const bedTime = parseISO(`${activity.date}T${activity.startTime}`)
                            totalMinutes += differenceInMinutes(nextMidnight, bedTime)
                        } else if (activity.title.toLowerCase().includes('sieste')) {
                            const start = parseISO(`${activity.date}T${activity.startTime}`)
                            const end = parseISO(`${activity.date}T${activity.endTime}`)
                            totalMinutes += differenceInMinutes(end, start)
                        }
                    } else {
                        const start = parseISO(`${activity.date}T${activity.startTime}`)
                        const end = parseISO(`${activity.date}T${activity.endTime}`)
                        totalMinutes += differenceInMinutes(end, start)
                    }
                })

                return {
                    name: category.name,
                    minutes: Math.floor(totalMinutes / 60) // Conversion en heures
                }
            })

            return {
                month: format(monthDate, 'MMMM yyyy', { locale: fr }),
                completionRate,
                totalActivities: monthActivities.length,
                ...categoryTimes.reduce((acc, cat) => ({
                    ...acc,
                    [cat.name]: cat.minutes
                }), {})
            }
        }).reverse()

        return last3Months
    }, [activities, categories])

    const detailedStats = useMemo(() => {
        return categories.map(category => {
            const categoryActivities = activities.filter(a => a.categoryId === category.id)
            const completedActivities = categoryActivities.filter(a => a.completed)

            let totalPlannedMinutes = 0
            let totalCompletedMinutes = 0
            let averageStartTime = 0
            let averageEndTime = 0
            let startTimeCount = 0
            let endTimeCount = 0

            categoryActivities.forEach(activity => {
                const start = parseISO(`2000-01-01T${activity.startTime}`)
                const end = parseISO(`2000-01-01T${activity.endTime}`)
                const duration = differenceInMinutes(end, start)

                totalPlannedMinutes += duration

                if (activity.completed) {
                    totalCompletedMinutes += duration

                    // Calcul des moyennes d'heures
                    const startMinutes = start.getHours() * 60 + start.getMinutes()
                    const endMinutes = end.getHours() * 60 + end.getMinutes()

                    averageStartTime += startMinutes
                    averageEndTime += endMinutes
                    startTimeCount++
                    endTimeCount++
                }
            })

            const avgStartTime = startTimeCount > 0
                ? new Date(2000, 0, 1,
                    Math.floor((averageStartTime / startTimeCount) / 60),
                    Math.floor((averageStartTime / startTimeCount) % 60))
                : null

            const avgEndTime = endTimeCount > 0
                ? new Date(2000, 0, 1,
                    Math.floor((averageEndTime / endTimeCount) / 60),
                    Math.floor((averageEndTime / endTimeCount) % 60))
                : null

            const efficiencyRatio = totalPlannedMinutes > 0
                ? (totalCompletedMinutes / totalPlannedMinutes) * 100
                : 0

            // Calculer la tendance par rapport au mois précédent
            const currentMonth = startOfMonth(new Date())
            const previousMonth = subMonths(currentMonth, 1)

            const currentMonthActivities = categoryActivities.filter(a =>
                isWithinInterval(parseISO(a.date), { start: currentMonth, end: endOfMonth(currentMonth) }))
            const previousMonthActivities = categoryActivities.filter(a =>
                isWithinInterval(parseISO(a.date), { start: previousMonth, end: endOfMonth(previousMonth) }))

            const currentEfficiency = currentMonthActivities.length > 0
                ? (currentMonthActivities.filter(a => a.completed).length / currentMonthActivities.length) * 100
                : 0
            const previousEfficiency = previousMonthActivities.length > 0
                ? (previousMonthActivities.filter(a => a.completed).length / previousMonthActivities.length) * 100
                : 0

            return {
                category,
                totalPlannedTime: totalPlannedMinutes,
                totalCompletedTime: totalCompletedMinutes,
                averageStartTime: avgStartTime,
                averageEndTime: avgEndTime,
                efficiencyRatio,
                trend: calculateTrend(currentEfficiency, previousEfficiency)
            }
        })
    }, [activities, categories])

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'general'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        Général
                    </button>
                    <button
                        onClick={() => setActiveTab('progression')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'progression'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        Progression
                    </button>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="all">Tout</option>
                </select>
            </div>

            {activeTab === 'general' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Temps par catégorie
                        </h3>
                        <div className="h-64">
                            <Bar
                                data={barChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top' as const,
                                            labels: {
                                                color: 'rgb(156, 163, 175)',
                                            },
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context: any) {
                                                    const label = context.dataset.label || '';
                                                    const value = context.parsed.y;
                                                    const hours = Math.floor(value);
                                                    const minutes = Math.round((value - hours) * 60);
                                                    return `${label}: ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                color: 'rgb(156, 163, 175)',
                                                callback: function (value: any) {
                                                    return value + 'h';
                                                }
                                            },
                                            grid: {
                                                color: 'rgba(156, 163, 175, 0.1)',
                                            },
                                        },
                                        x: {
                                            ticks: {
                                                color: 'rgb(156, 163, 175)',
                                            },
                                            grid: {
                                                display: false,
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Taux de complétion par catégorie
                        </h3>
                        <div className="h-64">
                            <Pie
                                data={pieChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                color: 'rgb(156, 163, 175)',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Détails par catégorie
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {detailedStats.map((stat) => (
                                <div
                                    key={stat.category.id}
                                    className="p-4 rounded-lg bg-white dark:bg-gray-700 shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {stat.category.name}
                                        </h4>
                                        <TrendIndicator trend={stat.trend} />
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between">
                                            <span>Temps prévu :</span>
                                            <span>{formatTime(stat.totalPlannedTime)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Temps effectué :</span>
                                            <span>{formatTime(stat.totalCompletedTime)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ratio d'efficacité :</span>
                                            <span className={`${stat.efficiencyRatio >= 90 ? 'text-green-500' :
                                                stat.efficiencyRatio >= 70 ? 'text-yellow-500' :
                                                    'text-red-500'
                                                }`}>
                                                {Math.round(stat.efficiencyRatio)}%
                                            </span>
                                        </div>
                                        {stat.averageStartTime && (
                                            <div className="flex justify-between">
                                                <span>Heure moyenne de début :</span>
                                                <span>{format(stat.averageStartTime, 'HH:mm')}</span>
                                            </div>
                                        )}
                                        {stat.averageEndTime && (
                                            <div className="flex justify-between">
                                                <span>Heure moyenne de fin :</span>
                                                <span>{format(stat.averageEndTime, 'HH:mm')}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex justify-between">
                                                <span>Activités totales :</span>
                                                <span>{stats.find(s => s.category.id === stat.category.id)?.totalActivities}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Activités complétées :</span>
                                                <span>{stats.find(s => s.category.id === stat.category.id)?.completedActivities}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Taux de complétion :</span>
                                                <span>{stats.find(s => s.category.id === stat.category.id)?.completionRate.toFixed(1)}%</span>
                                            </div>
                                            {stat.category.id === 'sleep' && stats.find(s => s.category.id === 'sleep')?.averageSleepTime && (
                                                <div className="flex justify-between">
                                                    <span>Temps de sommeil moyen :</span>
                                                    <span>
                                                        {Math.floor(stats.find(s => s.category.id === 'sleep')!.averageSleepTime! / 60)}h{' '}
                                                        {Math.round(stats.find(s => s.category.id === 'sleep')!.averageSleepTime! % 60)}min
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Évolution du temps consacré par catégorie (heures)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {categories.map((category) => (
                                        <Line
                                            key={category.id}
                                            type="monotone"
                                            dataKey={category.name}
                                            name={category.name}
                                            stroke={category.color.replace('bg-', '#')
                                                .replace('-500', '')
                                                .replace('blue', '3B82F6')
                                                .replace('green', '22C55E')
                                                .replace('purple', 'A855F7')
                                                .replace('red', 'EF4444')
                                                .replace('indigo', '6366F1')}
                                            strokeWidth={2}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Évolution du taux de complétion
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="completionRate"
                                        name="Taux de complétion (%)"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 