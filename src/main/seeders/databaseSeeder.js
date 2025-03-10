// Sample data for sections
const sections = [
  { name: 'BSIT-1A', schedule: 'MWF 8:00 AM - 9:30 AM' },
  { name: 'BSIT-1B', schedule: 'MWF 9:30 AM - 11:00 AM' },
  { name: 'BSIT-2A', schedule: 'TTH 8:00 AM - 9:30 AM' },
  { name: 'BSIT-2B', schedule: 'TTH 9:30 AM - 11:00 AM' },
  { name: 'BSCS-1A', schedule: 'MWF 1:00 PM - 2:30 PM' },
  { name: 'BSCS-1B', schedule: 'MWF 2:30 PM - 4:00 PM' },
  { name: 'BSCS-2A', schedule: 'TTH 1:00 PM - 2:30 PM' },
  { name: 'BSCS-2B', schedule: 'TTH 2:30 PM - 4:00 PM' },
  { name: 'BSIS-1A', schedule: 'MWF 4:00 PM - 5:30 PM' },
  { name: 'BSIS-1B', schedule: 'TTH 4:00 PM - 5:30 PM' }
]

// Sample data for student names
const firstNames = [
  'John', 'Maria', 'Michael', 'Sarah', 'David', 'Anna', 'James', 'Emma',
  'Daniel', 'Sofia', 'Matthew', 'Olivia', 'Andrew', 'Isabella', 'Joseph',
  'Sophia', 'William', 'Mia', 'Alexander', 'Charlotte'
]

const lastNames = [
  'Smith', 'Garcia', 'Martinez', 'Johnson', 'Brown', 'Davis', 'Rodriguez',
  'Miller', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin',
  'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez'
]

// Helper function to generate random student names
function generateStudentName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// Function to create tables
function createTables(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop existing tables if they exist
      db.run('DROP TABLE IF EXISTS attendance')
      db.run('DROP TABLE IF EXISTS students')
      db.run('DROP TABLE IF EXISTS sections')
      db.run('DROP TABLE IF EXISTS users')

      // Create tables
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT UNIQUE,
          password TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.run(`
        CREATE TABLE sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          schedule TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.run(`
        CREATE TABLE students (
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
        CREATE TABLE attendance (
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

// Function to seed sections
function seedSections(db) {
  return new Promise((resolve, reject) => {
    console.log('Inserting sections:', sections.map(s => s.name).join(', '))
    
    db.serialize(() => {
      const insertSection = db.prepare('INSERT INTO sections (name, schedule) VALUES (?, ?)')
      
      sections.forEach(section => {
        insertSection.run([section.name, section.schedule], (err) => {
          if (err) {
            console.error(`Error inserting section ${section.name}:`, err)
          } else {
            console.log(`✓ Inserted section: ${section.name}`)
          }
        })
      })
      
      insertSection.finalize()

      // Verify sections were inserted
      db.all('SELECT * FROM sections', [], (err, rows) => {
        if (err) {
          reject(err)
          return
        }
        console.log(`✅ Successfully inserted ${rows.length} sections`)
        resolve(rows)
      })
    })
  })
}

// Function to seed students
function seedStudents(db, sectionIds) {
  return new Promise((resolve, reject) => {
    // First get all sections with their IDs
    db.all('SELECT id, name, schedule FROM sections', [], (err, dbSections) => {
      if (err) {
        reject(err)
        return
      }

      console.log(`Found ${dbSections.length} sections to assign students to`)
      const students = []

      // Generate 30 students
      for (let i = 1; i <= 30; i++) {
        const randomSection = dbSections[Math.floor(Math.random() * dbSections.length)]
        const studentId = `2024-${String(i).padStart(4, '0')}`
        const name = generateStudentName()
        
        students.push({
          student_id: studentId,
          name: name,
          section_id: randomSection.id,
          schedule: randomSection.schedule
        })
        
        console.log(`Generated student: ${name} (${studentId}) - Section: ${randomSection.name}`)
      }

      db.serialize(() => {
        const insertStudent = db.prepare(
          'INSERT INTO students (student_id, name, section_id, schedule) VALUES (?, ?, ?, ?)'
        )
        
        students.forEach(student => {
          insertStudent.run([
            student.student_id,
            student.name,
            student.section_id,
            student.schedule
          ], (err) => {
            if (err) {
              console.error(`Error inserting student ${student.name}:`, err)
            } else {
              console.log(`✓ Inserted student: ${student.name} (${student.student_id})`)
            }
          })
        })
        
        insertStudent.finalize()

        // Verify students were inserted
        db.all('SELECT s.*, sec.name as section_name FROM students s JOIN sections sec ON s.section_id = sec.id', [], (err, rows) => {
          if (err) {
            reject(err)
            return
          }
          console.log(`✅ Successfully inserted ${rows.length} students`)
          resolve(rows)
        })
      })
    })
  })
}

// Function to seed attendance data
function seedAttendance(db, students) {
  return new Promise((resolve, reject) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 30) // Last 30 days

    console.log(`Generating attendance from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`)

    db.serialize(() => {
      const insertAttendance = db.prepare(
        'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)'
      )

      let totalRecords = 0
      // For each student
      students.forEach(student => {
        // For each day in the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue

          // Random attendance status with weighted probability
          const rand = Math.random()
          let status
          if (rand < 0.7) status = 'P'      // 70% chance of present
          else if (rand < 0.9) status = 'L'  // 20% chance of late
          else status = 'A'                  // 10% chance of absent

          insertAttendance.run([
            student.id,
            date.toISOString().split('T')[0],
            status
          ])
          totalRecords++
        }
      })

      insertAttendance.finalize()

      // Verify attendance records were inserted
      db.get('SELECT COUNT(*) as count FROM attendance', [], (err, result) => {
        if (err) {
          reject(err)
          return
        }
        console.log(`✅ Successfully inserted ${result.count} attendance records`)
        resolve(result.count)
      })
    })
  })
}

// Main seeder function
export async function seedDatabase(db) {
  try {
    console.log('\n🔄 Starting database seeding...')

    // Create tables
    console.log('\n📊 Creating tables...')
    await createTables(db)

    // Seed sections
    console.log('\n📚 Seeding sections...')
    await seedSections(db)

    // Seed students
    console.log('\n👥 Seeding students...')
    const students = await seedStudents(db)

    // Seed attendance
    console.log('\n📅 Seeding attendance records...')
    await seedAttendance(db, students)

    console.log('\n✅ Database seeding completed successfully!')
    
    // Print summary
    db.serialize(() => {
      db.get('SELECT COUNT(*) as sections FROM sections', [], (err, result) => {
        console.log(`\nSummary:`)
        console.log(`- Sections: ${result.sections}`)
      })
      db.get('SELECT COUNT(*) as students FROM students', [], (err, result) => {
        console.log(`- Students: ${result.students}`)
      })
      db.get('SELECT COUNT(*) as attendance FROM attendance', [], (err, result) => {
        console.log(`- Attendance Records: ${result.attendance}`)
      })
    })
    
    return true
  } catch (error) {
    console.error('\n❌ Error seeding database:', error)
    throw error
  }
} 