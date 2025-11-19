import * as fs from 'fs'
import * as path from 'path'
import { supabase } from '../lib/supabase'

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
        console.log(`✓ Migrated: ${contact.hebrew_first_name} ${contact.hebrew_last_name}`)
      }
    }
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateContacts()

