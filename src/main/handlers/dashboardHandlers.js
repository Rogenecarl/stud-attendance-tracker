import { getAttendanceStats } from '../database'

export function setupDashboardHandlers(ipcMain) {
  ipcMain.handle('dashboard:getData', async (event, { month, year, section_id }) => {
    try {
      const data = await getAttendanceStats(month, year, section_id)
      return { success: true, data }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return { success: false, error: error.message }
    }
  })
} 