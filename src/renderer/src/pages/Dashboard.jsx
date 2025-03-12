import { useState, useEffect } from 'react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  addWeeks,
  getWeek,
  isSameWeek
} from 'date-fns'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState(null)
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

  // Get weeks for the selected month
  const getWeeksInMonth = () => {
    const start = startOfMonth(selectedMonth)
    const end = endOfMonth(selectedMonth)
    
    return eachWeekOfInterval(
      { start, end },
      { weekStartsOn: 1 } // Start week on Monday
    ).map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      return {
        start: weekStart,
        end: weekEnd,
        label: `Week ${getWeek(weekStart, { weekStartsOn: 1 }) - getWeek(start, { weekStartsOn: 1 }) + 1}`
      }
    })
  }

  // Filter attendance data by selected week
  const getFilteredAttendanceData = () => {
    if (!selectedWeek) return attendanceData

    return attendanceData.filter(data => {
      const date = new Date(data.date)
      return isSameWeek(date, selectedWeek.start, { weekStartsOn: 1 })
    })
  }

  // Get attendance data organized by weekday
  const getWeekdayData = () => {
    const weekData = {
      Monday: { P: 0, L: 0, A: 0, total: 0 },
      Tuesday: { P: 0, L: 0, A: 0, total: 0 },
      Wednesday: { P: 0, L: 0, A: 0, total: 0 },
      Thursday: { P: 0, L: 0, A: 0, total: 0 },
      Friday: { P: 0, L: 0, A: 0, total: 0 },
      Saturday: { P: 0, L: 0, A: 0, total: 0 },
      Sunday: { P: 0, L: 0, A: 0, total: 0 }
    }

    const filteredData = getFilteredAttendanceData()
    
    // Group data by date first to handle multiple entries per day
    const groupedByDate = filteredData.reduce((acc, data) => {
      const date = new Date(data.date)
      const dayName = format(date, 'EEEE')
      
      if (!acc[dayName]) {
        acc[dayName] = { 
          P: 0, 
          L: 0, 
          A: 0, 
          total: stats.totalStudents,
          uniqueStudents: new Set() // Track unique students for overall stats
        }
      }
      
      // Count each status type and track unique students
      if (data.student_id) {
        acc[dayName].uniqueStudents.add(data.student_id)
        if (data.status === 'P') acc[dayName].P++
        else if (data.status === 'L') acc[dayName].L++
        else if (data.status === 'A') acc[dayName].A++
      }
      
      return acc
    }, {})

    // Fill in the weekData with the grouped data
    Object.entries(groupedByDate).forEach(([day, data]) => {
      const { uniqueStudents, ...rest } = data
      weekData[day] = {
        ...rest,
        total: selectedSection ? stats.totalStudents : uniqueStudents.size // Use unique students count for overall stats
      }
    })

    console.log('Processed week data:', weekData)
    return weekData
  }

  useEffect(() => {
    loadSections()
    loadDashboardData()
  }, [selectedMonth, selectedSection, selectedWeek])

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
      
      // Then get the attendance stats with the selected week if applicable
      const result = await window.electron.ipcRenderer.invoke('dashboard:getData', {
        month: format(selectedMonth, 'MM'),
        year: format(selectedMonth, 'yyyy'),
        section_id: selectedSection,
        week_start: selectedWeek ? format(selectedWeek.start, 'yyyy-MM-dd') : null,
        week_end: selectedWeek ? format(selectedWeek.end, 'yyyy-MM-dd') : null
      })

      if (result.success) {
        const totalStudents = studentsResult.success ? (
          selectedSection ? 
            studentsResult.data.filter(s => s.section_id === parseInt(selectedSection)).length :
            studentsResult.data.length
        ) : 0;

        const totalSections = sectionsResult.success ? sectionsResult.data.length : 0;

        console.log('Dashboard Data:', {
          attendanceData: result.data.attendanceData,
          stats: result.data.stats,
          totalStudents,
          totalSections
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

  // Update chart data to show daily percentages with proper trend lines
  const chartData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Present',
        data: Object.values(getWeekdayData()).map(day => 
          day.total > 0 ? (day.P / day.total) * 100 : 0
        ),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 3,
        order: 1,
        spanGaps: true
      },
      {
        label: 'Late',
        data: Object.values(getWeekdayData()).map(day => 
          day.total > 0 ? (day.L / day.total) * 100 : 0
        ),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(234, 179, 8)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 3,
        order: 2,
        spanGaps: true
      },
      {
        label: 'Absent',
        data: Object.values(getWeekdayData()).map(day => 
          day.total > 0 ? (day.A / day.total) * 100 : 0
        ),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 3,
        order: 3,
        spanGaps: true
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(243, 244, 246, 0.6)',
          drawBorder: false,
          drawTicks: true
        },
        ticks: {
          callback: value => `${value}%`,
          stepSize: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          color: '#6B7280'
        },
        title: {
          display: true,
          text: 'Percentage of Students',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#6B7280'
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: true,
          drawTicks: true
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
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: '500'
          }
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
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            if (!context || !context[0]) return '';
            return context[0].label || '';
          },
          label: function(context) {
            if (!context || context.raw === undefined) return '';
            
            const weekData = getWeekdayData();
            const dayData = weekData[context.raw.label || context.label] || { P: 0, L: 0, A: 0, total: 0 };
            const value = context.raw;
            let count = 0;
            
            switch(context.dataset.label) {
              case 'Present':
                count = dayData.P;
                break;
              case 'Late':
                count = dayData.L;
                break;
              case 'Absent':
                count = dayData.A;
                break;
              default:
                count = 0;
            }
            
            return `${context.dataset.label}: ${count} students (${value.toFixed(1)}%)`;
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

            {/* Week Selector */}
            <select
              value={selectedWeek ? `${format(selectedWeek.start, 'yyyy-MM-dd')}` : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  setSelectedWeek(null)
                } else {
                  const weekStart = new Date(e.target.value)
                  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
                  setSelectedWeek({ start: weekStart, end: weekEnd })
                }
              }}
              className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Weeks</option>
              {getWeeksInMonth().map((week, index) => (
                <option 
                  key={format(week.start, 'yyyy-MM-dd')} 
                  value={format(week.start, 'yyyy-MM-dd')}
                >
                  {week.label} ({format(week.start, 'MMM d')} - {format(week.end, 'MMM d')})
                </option>
              ))}
            </select>

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Daily Attendance Overview</h2>
              <div className="text-sm text-gray-500">
                {selectedWeek 
                  ? `${format(selectedWeek.start, 'MMM d')} - ${format(selectedWeek.end, 'MMM d')}`
                  : `Showing data for ${format(selectedMonth, 'MMMM yyyy')}`
                }
              </div>
            </div>
            <div className="h-[400px]">
              <Line data={chartData} options={chartOptions} />
            </div>
            {/* Daily Summary Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-4 text-left font-medium text-gray-500">Day</th>
                    <th className="py-2 px-4 text-center font-medium text-gray-500">Present</th>
                    <th className="py-2 px-4 text-center font-medium text-gray-500">Late</th>
                    <th className="py-2 px-4 text-center font-medium text-gray-500">Absent</th>
                    <th className="py-2 px-4 text-center font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(getWeekdayData()).map(([day, data]) => (
                    <tr key={day} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium text-gray-900">{day}</td>
                      <td className="py-2 px-4 text-center text-green-600">{data.P}</td>
                      <td className="py-2 px-4 text-center text-yellow-600">{data.L}</td>
                      <td className="py-2 px-4 text-center text-red-600">{data.A}</td>
                      <td className="py-2 px-4 text-center font-medium text-gray-900">{data.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
