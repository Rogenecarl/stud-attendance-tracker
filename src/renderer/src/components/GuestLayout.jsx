import { Outlet } from 'react-router-dom'

const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-16 text-white">
          <h1 className="text-3xl xl:text-4xl font-bold mb-4 xl:mb-6">Welcome to Attendance Tracker</h1>
          <p className="text-base xl:text-lg text-indigo-100 mb-6 xl:mb-8">
            Streamline your attendance management with our intuitive and efficient system.
          </p>
          <div className="flex gap-3 xl:gap-4">
            <div className="bg-white/10 rounded-xl xl:rounded-2xl p-4 xl:p-6 backdrop-blur-lg">
              <div className="text-2xl xl:text-3xl font-bold mb-1 xl:mb-2">500+</div>
              <div className="text-xs xl:text-sm text-indigo-100">Active Users</div>
            </div>
            <div className="bg-white/10 rounded-xl xl:rounded-2xl p-4 xl:p-6 backdrop-blur-lg">
              <div className="text-2xl xl:text-3xl font-bold mb-1 xl:mb-2">98%</div>
              <div className="text-xs xl:text-sm text-indigo-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full opacity-20" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full opacity-20" />
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center overflow-y-auto">
        {/* Content Container */}
        <div className="w-full max-w-md px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            <Outlet />
          </div>
        </div>

        {/* Mobile decorative elements */}
        <div className="lg:hidden fixed -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full opacity-[0.15] pointer-events-none" />
        <div className="lg:hidden fixed -top-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full opacity-[0.15] pointer-events-none" />
      </div>
    </div>
  )
}

export default GuestLayout
