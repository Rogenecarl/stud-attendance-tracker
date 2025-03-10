import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'path'
import bcrypt from 'bcryptjs'
import { seedDatabase } from './seeders/databaseSeeder'

// Change database path to store in project directory
const dbPath = path.join(__dirname, '..', '..', 'database.sqlite')
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

  // Call the external seeder
  seedDatabase(db).catch(error => {
    console.error('Failed to seed database:', error)
  })
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
        a.id,
        a.student_id,
        a.date,
        a.status,
        s.name as student_name,
        s.student_id as student_number,
        sec.name as section_name,
        sec.schedule as section_schedule
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN attendance a ON 
        a.student_id = s.id AND 
        strftime('%Y-%m', a.date) = ?
      WHERE 1=1
      ${section_id ? 'AND s.section_id = ?' : ''}
      ORDER BY s.name ASC, a.date ASC
    `

    const params = [
      `${year}-${month.padStart(2, '0')}`,
      ...(section_id ? [section_id] : [])
    ]

    console.log('Executing attendance query:', { query, params })

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error getting attendance:', err)
        reject(err)
      } else {
        console.log('Retrieved attendance records:', rows.length)
        resolve(rows)
      }
    })
  })
}

// Update markAttendance to handle attendance status
export function markAttendance(attendanceData) {
  return new Promise((resolve, reject) => {
    const { student_id, date, status } = attendanceData
    
    console.log('Marking attendance:', { student_id, date, status })

    // Validate status
    if (!['P', 'L', 'A', ''].includes(status)) {
      reject(new Error('Invalid attendance status'))
      return
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION')

      try {
        if (status === '') {
          // Delete the record if status is empty
          db.run(
            'DELETE FROM attendance WHERE student_id = ? AND date = ?',
            [student_id, date],
            function(err) {
              if (err) {
                db.run('ROLLBACK')
                console.error('Error deleting attendance:', err)
                reject(err)
              } else {
                db.run('COMMIT')
                console.log('Attendance record deleted')
                resolve({ success: true, id: null, action: 'deleted' })
              }
            }
          )
        } else {
          // Insert or update the record with explicit date format
          db.run(
            `INSERT OR REPLACE INTO attendance (student_id, date, status)
             VALUES (?, date(?), ?)`,
            [student_id, date, status],
            function(err) {
              if (err) {
                db.run('ROLLBACK')
                console.error('Error marking attendance:', err)
                reject(err)
              } else {
                db.run('COMMIT')
                console.log('Attendance marked successfully:', {
                  id: this.lastID,
                  action: 'updated',
                  student_id,
                  date,
                  status
                })
                resolve({
                  success: true,
                  id: this.lastID,
                  action: 'updated'
                })
              }
            }
          )
        }
      } catch (error) {
        db.run('ROLLBACK')
        reject(error)
      }
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
    // First, get the basic counts directly
    const basicCountsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM students ${section_id ? 'WHERE section_id = ?' : ''}) as total_students,
        (SELECT COUNT(*) FROM sections) as total_sections,
        (
          SELECT COUNT(*) 
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE strftime('%Y-%m', a.date) = ? 
          AND a.status = 'P'
          ${section_id ? 'AND s.section_id = ?' : ''}
        ) as total_present,
        (
          SELECT COUNT(*) 
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE strftime('%Y-%m', a.date) = ? 
          AND a.status = 'L'
          ${section_id ? 'AND s.section_id = ?' : ''}
        ) as total_late,
        (
          SELECT COUNT(*) 
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE strftime('%Y-%m', a.date) = ? 
          AND a.status = 'A'
          ${section_id ? 'AND s.section_id = ?' : ''}
        ) as total_absent
    `;

    const yearMonth = `${year}-${month.padStart(2, '0')}`;
    const basicCountsParams = [
      ...(section_id ? [section_id] : []),
      yearMonth,
      ...(section_id ? [section_id] : []),
      yearMonth,
      ...(section_id ? [section_id] : []),
      yearMonth,
      ...(section_id ? [section_id] : [])
    ];

    db.get(basicCountsQuery, basicCountsParams, (err, basicCounts) => {
      if (err) {
        console.error('Error getting basic counts:', err);
        reject(err);
        return;
      }

      // Now get the daily attendance data
      const dailyQuery = `
        WITH RECURSIVE 
        DateRange AS (
          SELECT date(?, ?, '01') as date
          UNION ALL
          SELECT date(date, '+1 day')
          FROM DateRange
          WHERE date < date(?, ?, (SELECT (strftime('%d', date(?, ?, '+1 month', '-1 day')))))
        )
        SELECT 
          d.date,
          COUNT(DISTINCT CASE WHEN a.status = 'P' THEN s.id END) as present_count,
          COUNT(DISTINCT CASE WHEN a.status = 'L' THEN s.id END) as late_count,
          COUNT(DISTINCT CASE WHEN a.status = 'A' THEN s.id END) as absent_count
        FROM DateRange d
        CROSS JOIN students s
        LEFT JOIN attendance a ON a.student_id = s.id AND date(a.date) = d.date
        ${section_id ? 'WHERE s.section_id = ?' : ''}
        GROUP BY d.date
        ORDER BY d.date DESC
      `;

      const dailyParams = [
        year, month.padStart(2, '0'),
        year, month.padStart(2, '0'),
        year, month.padStart(2, '0'),
        ...(section_id ? [section_id] : [])
      ];

      db.all(dailyQuery, dailyParams, (err, rows) => {
        if (err) {
          console.error('Error getting daily attendance:', err);
          reject(err);
          return;
        }

        const totalStudents = basicCounts.total_students || 0;

        const stats = {
          totalStudents: totalStudents,
          totalSections: basicCounts.total_sections || 0,
          totalPresent: basicCounts.total_present || 0,
          totalLate: basicCounts.total_late || 0,
          totalAbsent: basicCounts.total_absent || 0,
          presentPercentage: totalStudents > 0 ? (basicCounts.total_present / totalStudents) * 100 : 0,
          latePercentage: totalStudents > 0 ? (basicCounts.total_late / totalStudents) * 100 : 0,
          absentPercentage: totalStudents > 0 ? (basicCounts.total_absent / totalStudents) * 100 : 0
        };

        console.log('Calculated attendance stats:', stats);

        resolve({
          stats,
          attendanceData: rows.map(row => {
            const dailyTotal = totalStudents;
            return {
              date: row.date,
              present: row.present_count,
              late: row.late_count,
              absent: row.absent_count,
              presentPercentage: dailyTotal > 0 ? (row.present_count / dailyTotal) * 100 : 0,
              latePercentage: dailyTotal > 0 ? (row.late_count / dailyTotal) * 100 : 0,
              absentPercentage: dailyTotal > 0 ? (row.absent_count / dailyTotal) * 100 : 0
            };
          })
        });
      });
    });
  });
} 