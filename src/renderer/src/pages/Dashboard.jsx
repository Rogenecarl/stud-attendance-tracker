import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedSection, setSelectedSection] = useState('')
  const [sections, setSections] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSections: 0,
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    presentPercentage: 0,
    latePercentage: 0,
    absentPercentage: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    loadSections()
    loadDashboardData()
  }, [selectedMonth, selectedSection])

  const loadSections = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('sections:get')
      if (result.success) {
        setSections(result.data)
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      // First, get the total counts directly
      const sectionsResult = await window.electron.ipcRenderer.invoke('sections:get')
      const studentsResult = await window.electron.ipcRenderer.invoke('students:get')
      
      // Then get the attendance stats
      const result = await window.electron.ipcRenderer.invoke('dashboard:getData', {
        month: format(selectedMonth, 'MM'),
        year: format(selectedMonth, 'yyyy'),
        section_id: selectedSection
      })

      if (result.success) {
        const totalStudents = studentsResult.success ? (
          selectedSection ? 
            studentsResult.data.filter(s => s.section_id === parseInt(selectedSection)).length :
            studentsResult.data.length
        ) : 0;

        const totalSections = sectionsResult.success ? sectionsResult.data.length : 0;

        console.log('Dashboard Data:', {
          totalStudents,
          totalSections,
          studentsResult,
          sectionsResult
        });

        setStats({
          ...result.data.stats,
          totalStudents,
          totalSections
        });
        setAttendanceData(result.data.attendanceData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  // Update chart data to include percentages
  const chartData = {
    labels: attendanceData.map(data => format(new Date(data.date), 'd')).reverse(),
    datasets: [
      {
        label: 'Present',
        data: attendanceData.map(data => data.presentPercentage).reverse(),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Green color
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 6
      },
      {
        label: 'Late',
        data: attendanceData.map(data => data.latePercentage).reverse(),
        backgroundColor: 'rgba(234, 179, 8, 0.8)', // Yellow color
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 6
      },
      {
        label: 'Absent',
        data: attendanceData.map(data => data.absentPercentage).reverse(),
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red color
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 6
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: value => `${value}%`,
          stepSize: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(243, 244, 246, 1)',
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          color: '#6B7280'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        bodyColor: '#6B7280',
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        padding: 12,
        borderColor: 'rgba(229, 231, 235, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`
          }
        }
      }
    }
  }

  // Update donut chart data with actual percentages
  const donutData = {
    labels: ['Present', 'Late', 'Absent'],
    datasets: [
      {
        data: [
          stats.presentPercentage || 0,
          stats.latePercentage || 0,
          stats.absentPercentage || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for present
          'rgba(234, 179, 8, 0.8)', // Yellow for late
          'rgba(239, 68, 68, 0.8)', // Red for absent
        ],
        borderWidth: 0,
        cutout: '85%'
      }
    ]
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'white',
        titleColor: '#111827',
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        bodyColor: '#6B7280',
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        padding: 12,
        borderColor: 'rgba(229, 231, 235, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`
          }
        }
      }
    }
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const Calendar = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Get day names
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Get days from previous month to fill the first week
    const firstDayOfMonth = start.getDay()
    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
      const date = new Date(start)
      date.setDate(-i)
      return date
    }).reverse()

    // Get days for next month to fill the last week
    const lastDayOfMonth = end.getDay()
    const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) => {
      const date = new Date(end)
      date.setDate(end.getDate() + i + 1)
      return date
    })

    const handleDateClick = (date) => {
      setSelectedMonth(date)
      onClose()
    }

    return (
      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-[280px]">
        {/* Month and Year header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="p-3">
          <div className="grid grid-cols-7 gap-0">
            {/* Day names */}
            {dayNames.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Previous month days */}
            {prevMonthDays.map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400"
              >
                {date.getDate()}
              </button>
            ))}

            {/* Current month days */}
            {days.map(date => {
              const isToday = date.toDateString() === new Date().toDateString()
              const isSelected = date.toDateString() === selectedMonth.toDateString()

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`h-8 w-8 flex items-center justify-center text-xs transition-colors
                    ${isToday ? 'text-blue-600 font-medium' : ''}
                    ${isSelected ? 'bg-blue-600 text-white rounded-full' : 'hover:bg-gray-100'}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}

            {/* Next month days */}
            {nextMonthDays.map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400"
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            {/* Month Selector with Calendar */}
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{format(selectedMonth, 'MMMM yyyy')}</span>
              </button>

              <Calendar 
                isOpen={showCalendar} 
                onClose={() => setShowCalendar(false)} 
              />
            </div>

            {/* Section Selector */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-gray-900 mt-1">{stats.totalStudents}</h3>
                    <span className="text-sm font-medium text-gray-500">students enrolled</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-indigo-50 px-3 py-1 rounded-lg">
                  <span className="text-sm font-medium text-indigo-600">
                    {stats.totalSections} {stats.totalSections === 1 ? 'Section' : 'Sections'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedSection ? 'Current Section' : 'All Sections'}
                </p>
              </div>
            </div>
            {/* Decorative background */}
            <div className="absolute right-0 bottom-0 opacity-5">
              <svg className="w-48 h-48 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zm0 2c-4 0-12 2-12 6v2h24v-2c0-4-8-6-12-6z" />
              </svg>
            </div>
          </div>

          {/* Present Rate Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Present Rate</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">
                  {(stats.presentPercentage || 0).toFixed(1)}%
                </h3>
              </div>
            </div>
          </div>

          {/* Late Rate Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-50 p-3 rounded-xl">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Late Rate</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-1">
                  {(stats.latePercentage || 0).toFixed(1)}%
                </h3>
              </div>
            </div>
          </div>

          {/* Absent Rate Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-xl">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Absent Rate</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">
                  {(stats.absentPercentage || 0).toFixed(1)}%
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Attendance Chart */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Attendance Overview</h2>
            <div className="h-[400px]">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Monthly Statistics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Overview</h2>
            <div className="relative h-[300px] flex items-center justify-center">
              <div className="w-[200px] h-[200px]">
                <Doughnut data={donutData} options={donutOptions} />
              </div>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-green-600">
                  {(stats.presentPercentage || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 font-medium">Present Rate</div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Present</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(stats.presentPercentage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">Late</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(stats.latePercentage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Absent</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(stats.absentPercentage || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
