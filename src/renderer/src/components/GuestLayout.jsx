import { Outlet } from 'react-router-dom'

const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome to Attendance Tracker</h1>
          <p className="text-lg text-indigo-100 mb-8">
            Streamline your attendance management with our intuitive and efficient system.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-sm text-indigo-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg">
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-sm text-indigo-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full opacity-20" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full opacity-20" />
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Main Content */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default GuestLayout
