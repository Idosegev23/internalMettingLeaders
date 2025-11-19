import { getContacts } from './formService'
import { Contact as DbContact } from './supabase'
import { Contact } from '@/types/form'

export async function loadContacts(): Promise<Contact[]> {
  try {
    const dbContacts = await getContacts()
    
    return dbContacts.map((contact: DbContact) => ({
      firstName: contact.first_name,
      lastName: contact.last_name,
      hebrewFirstName: contact.hebrew_first_name,
      hebrewLastName: contact.hebrew_last_name,
      email: contact.email
    }))
  } catch (error) {
    console.error('Error loading contacts:', error)
    return []
  }
}

export function searchContacts(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return []
  
  const lowerQuery = query.toLowerCase()
  
  return contacts.filter(contact => {
    const fullNameEn = `${contact.firstName} ${contact.lastName}`.toLowerCase()
    const fullNameHe = `${contact.hebrewFirstName} ${contact.hebrewLastName}`.toLowerCase()
    const email = contact.email.toLowerCase()
    
    return (
      fullNameEn.includes(lowerQuery) ||
      fullNameHe.includes(lowerQuery) ||
      email.includes(lowerQuery) ||
      contact.firstName.toLowerCase().includes(lowerQuery) ||
      contact.lastName.toLowerCase().includes(lowerQuery) ||
      contact.hebrewFirstName.toLowerCase().includes(lowerQuery) ||
      contact.hebrewLastName.toLowerCase().includes(lowerQuery)
    )
  }).slice(0, 10) // Limit to 10 results
}

