import { getAttendance, markAttendance, getAttendanceByDateRange } from '../database'

export function setupAttendanceHandlers(ipcMain) {
  ipcMain.handle('attendance:get', async (event, { month, year, section_id }) => {
    try {
      const attendance = await getAttendance(month, year, section_id)
      return { success: true, data: attendance }
    } catch (error) {
      console.error('Error getting attendance:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('attendance:mark', async (event, attendanceData) => {
    try {
      const result = await markAttendance(attendanceData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('attendance:getByDateRange', async (event, { startDate, endDate, section_id }) => {
    try {
      const attendance = await getAttendanceByDateRange(startDate, endDate, section_id)
      return { success: true, data: attendance }
    } catch (error) {
      console.error('Error getting attendance by date range:', error)
      return { success: false, error: error.message }
    }
  })
} 