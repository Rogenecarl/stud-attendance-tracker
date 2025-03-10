import { getSections, addSection, updateSection, deleteSection } from '../database.js'

export function setupSectionHandlers(ipcMain) {
  ipcMain.handle('sections:get', async () => {
    try {
      const sections = await getSections()
      return { success: true, data: sections }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('sections:add', async (event, sectionData) => {
    try {
      const result = await addSection(sectionData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('sections:update', async (event, { id, ...sectionData }) => {
    try {
      const result = await updateSection(id, sectionData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('sections:delete', async (event, id) => {
    try {
      await deleteSection(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
} 