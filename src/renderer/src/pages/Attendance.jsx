import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import Pagination from '../components/Pagination'

const Attendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedSection, setSelectedSection] = useState('')
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filteredStudents, setFilteredStudents] = useState([])
  const [toast, setToast] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Get number of days in selected month
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await loadSections()
      await loadStudents()
      setIsLoading(false)
    }
    initializeData()
  }, [])

  // Handle filtered students
  useEffect(() => {
    filterStudents()
  }, [selectedSection, students])

  // Load attendance when dependencies change
  useEffect(() => {
    const loadData = async () => {
      if (!isLoading && filteredStudents.length > 0) {
        console.log('Loading attendance data...')
        await loadAttendance()
      }
    }
    loadData()
  }, [selectedMonth, filteredStudents, isLoading])

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

  const loadStudents = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('students:get')
      if (result.success) {
        setStudents(result.data)
        setFilteredStudents(result.data)
      }
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadAttendance = async () => {
    try {
      const month = format(selectedMonth, 'MM')
      const year = format(selectedMonth, 'yyyy')
      
      console.log('Loading attendance for:', {
        month,
        year,
        section_id: selectedSection || null,
        filteredStudents: filteredStudents.length
      })

      const result = await window.electron.ipcRenderer.invoke('attendance:get', {
        month,
        year,
        section_id: selectedSection || null
      })

      if (result.success) {
        // Initialize attendance map
        const attendanceMap = {}
        
        // Process attendance records
        result.data.forEach(record => {
          if (!record.student_id) return // Skip if no student_id
          
          if (!attendanceMap[record.student_id]) {
            attendanceMap[record.student_id] = {}
          }
          
          if (record.date) {
            const day = new Date(record.date).getDate()
            attendanceMap[record.student_id][day] = record.status || ''
          }
        })
        
        console.log('Setting attendance map:', attendanceMap)
        setAttendance(attendanceMap)
      } else {
        console.error('Failed to load attendance:', result.error)
        showToast('Failed to load attendance data', 'error')
      }
    } catch (error) {
      console.error('Failed to load attendance:', error)
      showToast('Failed to load attendance data', 'error')
    }
  }

  const handleAttendanceChange = async (studentId, day, newStatus) => {
    try {
      const student = filteredStudents.find(s => s.id === studentId)
      const date = format(
        new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          day
        ),
        'yyyy-MM-dd'
      )

      console.log('Marking attendance:', { studentId, date, newStatus })

      // Save to database
      const result = await window.electron.ipcRenderer.invoke('attendance:mark', {
        student_id: studentId,
        date,
        status: newStatus
      })

      if (!result.success) {
        console.error('Failed to mark attendance:', result.error)
        showToast('Failed to save attendance', 'error')
        return
      }

      // Update local state after successful save
      setAttendance(prev => {
        const newState = { ...prev }
        if (!newState[studentId]) {
          newState[studentId] = {}
        }
        
        if (newStatus === '') {
          delete newState[studentId][day]
        } else {
          newState[studentId][day] = newStatus
        }
        
        return newState
      })

      // Show success toast message
      if (newStatus) {
        const statusMessages = {
          'P': `Marked ${student.name} as Present`,
          'L': `Marked ${student.name} as Late`,
          'A': `Marked ${student.name} as Absent`
        }
        const statusTypes = {
          'P': 'present',
          'L': 'late',
          'A': 'absent'
        }
        showToast(statusMessages[newStatus], statusTypes[newStatus])
      } else {
        showToast(`Cleared attendance for ${student.name}`, 'info')
      }

      // Reload attendance to ensure consistency
      await loadAttendance()

    } catch (error) {
      console.error('Failed to mark attendance:', error)
      showToast('Failed to save attendance', 'error')
      // Reload attendance to ensure consistency
      await loadAttendance()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'P':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'L':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'A':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const filterStudents = () => {
    if (!selectedSection) {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(
        student => student.section_id === parseInt(selectedSection)
      )
      setFilteredStudents(filtered)
    }
  }

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value)
    loadAttendance()
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleCalendarDateSelect = (date) => {
    setSelectedMonth(date)
    setCurrentMonth(date)
    setShowCalendar(false)
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
                onClick={() => handleCalendarDateSelect(date)}
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
                  onClick={() => handleCalendarDateSelect(date)}
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
                onClick={() => handleCalendarDateSelect(date)}
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

  // Add this helper function to check if a date is in the past
  const isDateInPast = (day) => {
    const attendanceDate = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      day
    )
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return attendanceDate < today
  }

  // Add this helper function to get status label for tooltips
  const getStatusLabel = (status) => {
    switch (status) {
      case 'P':
        return 'Present'
      case 'L':
        return 'Late'
      case 'A':
        return 'Absent'
      default:
        return 'Not marked'
    }
  }

  // Toast notification component
  const Toast = ({ message, type }) => {
    const bgColor = {
      present: 'bg-green-500',
      late: 'bg-yellow-500',
      absent: 'bg-red-500',
      error: 'bg-gray-500'
    }[type] || 'bg-gray-500'

    const icon = {
      present: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      late: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      absent: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }[type]

    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg animate-fade-in-up">
        <div className={`${bgColor} px-4 py-2 rounded-lg flex items-center gap-2`}>
          {icon}
          <span className="font-medium">{message}</span>
        </div>
      </div>
    )
  }

  // Show toast message
  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000) // Hide after 3 seconds
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedSection, selectedMonth])

  // Update pagination calculations
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of table when page changes
    document.querySelector('.overflow-x-auto')?.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Management</h1>
        
        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-6">
            {/* Month Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{format(selectedMonth, 'MMMM yyyy')}</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Calendar Component */}
              <Calendar 
                isOpen={showCalendar} 
                onClose={() => setShowCalendar(false)} 
              />
            </div>

            {/* Section Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select
                value={selectedSection}
                onChange={handleSectionChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Sections</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    [{section.name}] {section.schedule}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    P
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    A
                  </th>
                  {[...Array(daysInMonth)].map((_, i) => (
                    <th key={i + 1} className="px-2 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedStudents.map((student, idx) => {
                  const studentAttendance = attendance[student.id] || {};
                  const presentCount = Object.values(studentAttendance).filter(status => status === 'P').length;
                  const lateCount = Object.values(studentAttendance).filter(status => status === 'L').length;
                  const absentCount = Object.values(studentAttendance).filter(status => status === 'A').length;

                  return (
                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">
                          {sections.find(s => s.id === student.section_id)?.name || 'No Section'}
                          {' '}
                          {sections.find(s => s.id === student.section_id)?.schedule || ''}
                        </div>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="text-sm font-medium text-green-600">{presentCount}</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="text-sm font-medium text-yellow-600">{lateCount}</span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <span className="text-sm font-medium text-red-600">{absentCount}</span>
                      </td>
                      {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const status = studentAttendance[day] || '';
                        const statusColor = getStatusColor(status);
                        const isPastDate = isDateInPast(day);
                        const statusLabel = getStatusLabel(status);

                        return (
                          <td key={day} className="px-2 py-4 text-center">
                            {isPastDate ? (
                              <div 
                                className={`w-16 py-1.5 px-2 text-sm border rounded-lg ${statusColor} cursor-not-allowed`}
                                title={statusLabel}
                              >
                                {status || '-'}
                              </div>
                            ) : (
                              <select
                                value={status}
                                onChange={(e) => handleAttendanceChange(student.id, day, e.target.value)}
                                className={`w-16 py-1.5 px-2 text-sm border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 ${statusColor}`}
                                title={statusLabel}
                              >
                                <option value="">-</option>
                                <option value="P" className="text-green-600 bg-white">P</option>
                                <option value="L" className="text-yellow-600 bg-white">L</option>
                                <option value="A" className="text-red-600 bg-white">A</option>
                              </select>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))}
            onPageChange={handlePageChange}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Add the toast notification */}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </div>
  )
}

// Add these styles to your CSS or Tailwind config
const styles = `
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}
`

export default Attendance


