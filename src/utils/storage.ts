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

const STORAGE_KEY = 'weekly-planner-data'

type StorageData = {
  userId: string
  currentWeek: DaySchedule[]
  categories: Category[]
}

export const saveData = (data: StorageData) => {
  try {
    const serializedData = {
      ...data,
      currentWeek: data.currentWeek.map((day) => ({
        ...day,
        date: day.date.toISOString(),
      })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedData))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error)
  }
}

export const loadData = (userId: string): StorageData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const parsedData = JSON.parse(data)
    if (parsedData.userId !== userId) return null

    return {
      ...parsedData,
      currentWeek: parsedData.currentWeek.map((day: any) => ({
        ...day,
        date: new Date(day.date),
      })),
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    return null
  }
}

export const clearData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error)
  }
} 