import { useState, useEffect } from 'react'

const Settings = () => {
  const [dbPath, setDbPath] = useState('')

  useEffect(() => {
    const getPath = async () => {
      const path = await window.electron.ipcRenderer.invoke('get:dbPath')
      setDbPath(path)
    }
    getPath()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {/* Database Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Database Location</h2>
            <p className="text-sm text-gray-500 mb-4">The current location of your database file.</p>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-gray-600">{dbPath}</code>
                <button 
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  onClick={() => {/* Add copy functionality */}}
                >
                  Copy Path
                </button>
              </div>
            </div>
          </div>

          {/* Add more settings sections here */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Application Theme</h2>
            <p className="text-sm text-gray-500 mb-4">Choose your preferred application theme.</p>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200">
                Light
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-200">
                Dark
              </button>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Data Export</h2>
            <p className="text-sm text-gray-500 mb-4">Export your attendance data to different formats.</p>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to CSV
              </button>
              <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export to PDF
              </button>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">About</h2>
            <p className="text-sm text-gray-500 mb-4">Information about this application.</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">March 15, 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Developer</span>
                <span className="text-sm font-medium text-gray-900">Your Name</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings


