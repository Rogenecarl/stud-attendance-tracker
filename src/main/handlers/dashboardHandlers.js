import { getAttendanceStats } from '../database'

export function setupDashboardHandlers(ipcMain) {
  console.log('Setting up dashboard handlers...')
  
  ipcMain.handle('dashboard:getData', async (event, { month, year, section_id }) => {
    console.log('Received dashboard:getData request:', { month, year, section_id })
    
    try {
      const data = await getAttendanceStats(month, year, section_id)
      console.log('Dashboard data retrieved successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return { success: false, error: error.message }
    }
  })
  
  console.log('Dashboard handlers setup complete')
} 