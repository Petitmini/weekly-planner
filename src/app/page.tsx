import WeeklyPlanner from '@/components/WeeklyPlanner'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Planning Hebdomadaire
        </h1>
        <WeeklyPlanner />
      </div>
    </main>
  )
}
