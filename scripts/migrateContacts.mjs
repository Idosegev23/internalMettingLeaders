import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rdhlmqzunnuhmsclhimq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkaGxtcXp1bm51aG1zY2xoaW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzgyMzEsImV4cCI6MjA3OTExNDIzMX0.MhzeQbHynnjX9IVBwHwX_nF6TpsQN4gCUeyGRyxtPkk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function migrateContacts() {
  try {
    console.log('Starting contacts migration...')
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public', 'Contacts - שמות מלא.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // Parse CSV
    const lines = csvContent.split('\n').slice(1) // Skip header
    const contacts = lines
      .filter(line => line.trim())
      .map(line => {
        const [firstName, lastName, hebrewFirstName, hebrewLastName, email] = line.split(',')
        return {
          first_name: firstName?.trim() || '',
          last_name: lastName?.trim() || '',
          hebrew_first_name: hebrewFirstName?.trim() || '',
          hebrew_last_name: hebrewLastName?.trim() || '',
          email: email?.trim() || ''
        }
      })
      .filter(contact => contact.email) // Only include contacts with email
    
    console.log(`Found ${contacts.length} contacts to migrate`)
    
    // Upsert contacts (insert or update if email exists)
    let successCount = 0
    for (const contact of contacts) {
      const { error } = await supabase
        .from('contacts')
        .upsert(contact, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
      
      if (error) {
        console.error(`Error upserting contact ${contact.email}:`, error)
      } else {
        successCount++
        console.log(`✓ ${successCount}/${contacts.length}: ${contact.hebrew_first_name} ${contact.hebrew_last_name}`)
      }
    }
    
    console.log(`\nMigration completed! Successfully migrated ${successCount} out of ${contacts.length} contacts.`)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateContacts()

