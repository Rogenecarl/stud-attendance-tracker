import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'path'
import bcrypt from 'bcryptjs'

const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
console.log('Database path:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err)
  } else {
    console.log('Database connected')
    initDatabase()
  }
})

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schedule TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      section_id INTEGER,
      schedule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections (id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      date DATE,
      status TEXT CHECK(status IN ('P', 'L', 'A')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id)
    )
  `)
}

export async function registerUser(userData) {
  const { name, email, password } = userData
  const hashedPassword = await bcrypt.hash(password, 10)

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      }
    )
  })
}

export async function loginUser(email, password) {
  console.log('Attempting login for email:', email)
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err)
        reject(err)
      } else if (!user) {
        console.log('User not found for email:', email)
        reject(new Error('User not found'))
      } else {
        console.log('User found, comparing passwords')
        try {
          const passwordMatch = await bcrypt.compare(password, user.password)
          console.log('Password match result:', passwordMatch)
          
          if (passwordMatch) {
            resolve({
              id: user.id,
              name: user.name,
              email: user.email
            })
          } else {
            reject(new Error('Invalid password'))
          }
        } catch (error) {
          console.error('Password comparison error:', error)
          reject(error)
        }
      }
    })
  })
}

export function getDatabasePath() {
  return dbPath
}

// Add section CRUD operations
export function getSections() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM sections ORDER BY id DESC', [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function addSection(sectionData) {
  const { name, schedule } = sectionData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO sections (name, schedule) VALUES (?, ?)',
      [name, schedule],
      function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID })
      }
    )
  })
}

export function updateSection(id, sectionData) {
  const { name, schedule } = sectionData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE sections SET name = ?, schedule = ? WHERE id = ?',
      [name, schedule, id],
      (err) => {
        if (err) reject(err)
        else resolve({ id })
      }
    )
  })
}

export function deleteSection(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM sections WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve({ id })
    })
  })
}

// Update student functions to work with sections
export function getStudentsWithSections() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT students.*, sections.name as section_name, sections.schedule 
      FROM students 
      LEFT JOIN sections ON students.section_id = sections.id 
      ORDER BY students.id DESC
    `, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update the getStudents function to include section information
export function getStudents() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        students.*,
        sections.name as section_name,
        sections.schedule as section_schedule
      FROM students
      LEFT JOIN sections ON students.section_id = sections.id
      ORDER BY students.id DESC
    `, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update addStudent function
export function addStudent(studentData) {
  const { name, student_id, section_id, schedule } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO students (name, student_id, section_id, schedule) VALUES (?, ?, ?, ?)',
      [name, student_id, section_id, schedule],
      function (err) {
        if (err) {
          console.error('Database error:', err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      }
    )
  })
}

// Update updateStudent function
export function updateStudent(id, studentData) {
  const { name, student_id, section_id, schedule } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET name = ?, student_id = ?, section_id = ?, schedule = ? WHERE id = ?',
      [name, student_id, section_id, schedule, id],
      (err) => {
        if (err) reject(err)
        else resolve({ id })
      }
    )
  })
}

export function deleteStudent(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM students WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve({ id })
    })
  })
}

// Update resetDatabase function to be more specific
export function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Only drop tables if explicitly needed
      db.run(`DROP TABLE IF EXISTS attendance`)
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER,
          date DATE,
          status TEXT CHECK(status IN ('P', 'L', 'A')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id)
        )
      `, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

// Update getAttendance to include student info
export function getAttendance(month, year, section_id = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.student_id,
        s.section_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE strftime('%m-%Y', a.date) = ?
    `
    const params = [`${month}-${year}`]

    if (section_id) {
      query += ' AND s.section_id = ?'
      params.push(section_id)
    }

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update markAttendance to handle multiple records
export function markAttendance(attendanceData) {
  return new Promise((resolve, reject) => {
    const { student_id, date, status } = attendanceData
    
    db.run(`
      INSERT OR REPLACE INTO attendance (student_id, date, status)
      VALUES (?, ?, ?)
    `, [student_id, date, status], function(err) {
      if (err) reject(err)
      else resolve({ id: this.lastID })
    })
  })
}

// Add function to get attendance by date range
export function getAttendanceByDateRange(startDate, endDate, section_id = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.student_id,
        s.section_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (section_id) {
      query += ' AND s.section_id = ?'
      params.push(section_id)
    }

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function getAttendanceStats(month, year, section_id = null) {
  return new Promise((resolve, reject) => {
    let baseQuery = `
      SELECT COUNT(*) as total_students
      FROM students s
      ${section_id ? 'WHERE s.section_id = ?' : ''}
    `

    let attendanceQuery = `
      SELECT 
        a.date,
        COUNT(CASE WHEN a.status = 'P' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'L' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'A' THEN 1 END) as absent_count,
        COUNT(DISTINCT CASE WHEN a.status = 'P' THEN s.id END) as total_present,
        COUNT(DISTINCT CASE WHEN a.status = 'L' THEN s.id END) as total_late,
        COUNT(DISTINCT CASE WHEN a.status = 'A' THEN s.id END) as total_absent
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE strftime('%m-%Y', a.date) = ?
      ${section_id ? 'AND s.section_id = ?' : ''}
      GROUP BY a.date
    `

    const params = section_id ? [section_id] : []
    const attendanceParams = [`${month}-${year}`, ...(section_id ? [section_id] : [])]

    db.get(baseQuery, params, (err, totalResult) => {
      if (err) {
        reject(err)
        return
      }

      db.all(attendanceQuery, attendanceParams, (err, rows) => {
        if (err) {
          reject(err)
          return
        }

        const stats = {
          totalStudents: totalResult.total_students,
          totalPresent: rows[0]?.total_present || 0,
          totalLate: rows[0]?.total_late || 0,
          totalAbsent: rows[0]?.total_absent || 0
        }

        resolve({
          stats,
          attendanceData: rows.map(row => ({
            date: row.date,
            present: row.present_count,
            late: row.late_count,
            absent: row.absent_count
          }))
        })
      })
    })
  })
} 