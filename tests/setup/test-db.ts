import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../src/db/schema'
import { readFileSync } from 'fs'
import path from 'path'

export function createTestDB() {
  // Create a unique temporary database file for this test run
  const testDbPath = `./test-db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.sqlite`
  const sqlite = new Database(testDbPath)
  const db = drizzle(sqlite, { schema })
  
  // Use the existing migration SQL directly (much cleaner!)
  runInitialMigration(sqlite)
  
  return { 
    db, 
    sqlite,
    cleanup: () => {
      sqlite.close()
      try {
        require('fs').unlinkSync(testDbPath)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

function runInitialMigration(sqlite: InstanceType<typeof Database>) {
  try {
    // Use the drizzle migration system - this is the cleanest approach
    migrate(drizzle(sqlite, { schema }), { migrationsFolder: './drizzle/migrations' })
  } catch (error) {
    console.warn('Failed to run drizzle migration, trying direct SQL:', error)
    
    // Fallback: try to read the migration file directly
    try {
      const migrationPath = path.join(process.cwd(), 'drizzle', 'migrations', '0000_abnormal_nocturne.sql')
      const migrationSQL = readFileSync(migrationPath, 'utf-8')
      
      // Execute the migration SQL
      sqlite.exec(migrationSQL)
    } catch (migrationError) {
      console.error('Both migration methods failed:', migrationError)
      throw new Error('Unable to set up test database schema')
    }
  }
} 