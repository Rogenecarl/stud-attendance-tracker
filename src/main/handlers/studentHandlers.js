import { getStudents, addStudent, updateStudent, deleteStudent, resetDatabase } from '../database.js'

export function setupStudentHandlers(ipcMain) {
  ipcMain.handle('students:get', async () => {
    try {
      const students = await getStudents()
      return { success: true, data: students }
    } catch (error) {
      console.error('Error getting students:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:add', async (event, studentData) => {
    try {
      const result = await addStudent(studentData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error adding student:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:update', async (event, studentData) => {
    try {
      const result = await updateStudent(studentData.id, studentData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error updating student:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:delete', async (event, id) => {
    try {
      const result = await deleteStudent(id)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error deleting student:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:reset-db', async () => {
    try {
      await resetDatabase()
      return { success: true }
    } catch (error) {
      console.error('Reset database error:', error)
      return { success: false, error: error.message }
    }
  })
} 