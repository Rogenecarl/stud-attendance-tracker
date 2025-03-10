import { loginUser, registerUser } from '../database.js'

export function setupAuthHandlers(ipcMain) {
  // Login handler
  ipcMain.handle('auth:login', async (event, credentials) => {
    console.log('Login attempt received for:', credentials.email)
    
    try {
      const user = await loginUser(credentials.email, credentials.password)
      console.log('Login successful for:', credentials.email)
      return {
        success: true,
        data: user
      }
    } catch (error) {
      console.error('Login error:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // Register handler
  ipcMain.handle('auth:register', async (event, userData) => {
    try {
      const result = await registerUser(userData)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  })
} 