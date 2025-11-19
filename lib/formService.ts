import { getSupabase, Form, InnerMeetingForm, FormWithDetails, Contact, FormParticipant } from './supabase'
import { FormData } from '@/types/form'

const getClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Form service should only be used on the client side')
  }
  return getSupabase()
}

// Helper function to sanitize text (remove double quotes)
const sanitizeText = (text: string): string => {
  return text.replace(/"/g, "'")
}

// Create a new form draft
export async function createFormDraft(): Promise<{ form: Form; innerForm: InnerMeetingForm } | null> {
  try {
    const supabase = getClient()
    // Create the form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        type: 'inner_meeting',
        status: 'draft',
        title: null
      })
      .select()
      .single()

    if (formError) throw formError

    // Create the inner_meeting_form
    const { data: innerForm, error: innerFormError } = await supabase
      .from('inner_meeting_forms')
      .insert({
        form_id: form.id
      })
      .select()
      .single()

    if (innerFormError) throw innerFormError

    return { form, innerForm }
  } catch (error) {
    console.error('Error creating form draft:', error)
    return null
  }
}

// Update form data
export async function updateFormData(
  formId: string,
  innerFormId: string,
  data: Partial<InnerMeetingForm>
): Promise<boolean> {
  try {
    const supabase = getClient()
    // Update inner_meeting_form
    const { error: innerFormError } = await supabase
      .from('inner_meeting_forms')
      .update(data)
      .eq('id', innerFormId)

    if (innerFormError) throw innerFormError

    // Update form's updated_at and title if client_name is provided
    const updateData: any = {}
    if (data.client_name) {
      updateData.title = data.client_name
    }

    if (Object.keys(updateData).length > 0) {
      const { error: formError } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', formId)

      if (formError) throw formError
    }

    return true
  } catch (error) {
    console.error('Error updating form data:', error)
    return false
  }
}

// Get form by share token
export async function getFormByToken(token: string): Promise<FormWithDetails | null> {
  try {
    const supabase = getClient()
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('share_token', token)
      .single()

    if (formError) throw formError

    // Get inner meeting form
    const { data: innerForm, error: innerFormError } = await supabase
      .from('inner_meeting_forms')
      .select('*')
      .eq('form_id', form.id)
      .single()

    if (innerFormError && innerFormError.code !== 'PGRST116') throw innerFormError

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('form_participants')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('form_id', form.id)

    if (participantsError) throw participantsError

    return {
      ...form,
      inner_meeting_form: innerForm,
      participants: participants as any
    }
  } catch (error) {
    console.error('Error getting form by token:', error)
    return null
  }
}

// Get all forms (with optional status filter)
export async function getForms(status?: 'draft' | 'completed'): Promise<FormWithDetails[]> {
  try {
    const supabase = getClient()
    let query = supabase
      .from('forms')
      .select(`
        *,
        inner_meeting_forms(*)
      `)
      .eq('type', 'inner_meeting')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return data as any
  } catch (error) {
    console.error('Error getting forms:', error)
    return []
  }
}

// Update form participants
export async function updateFormParticipants(
  formId: string,
  participants: Array<{ contact_id: string; role: string }>
): Promise<boolean> {
  try {
    const supabase = getClient()
    // Delete existing participants for these roles
    const roles = [...new Set(participants.map(p => p.role))]
    const { error: deleteError } = await supabase
      .from('form_participants')
      .delete()
      .eq('form_id', formId)
      .in('role', roles)

    if (deleteError) throw deleteError

    // Insert new participants
    if (participants.length > 0) {
      const { error: insertError } = await supabase
        .from('form_participants')
        .insert(
          participants.map(p => ({
            form_id: formId,
            contact_id: p.contact_id,
            role: p.role
          }))
        )

      if (insertError) throw insertError
    }

    return true
  } catch (error) {
    console.error('Error updating form participants:', error)
    return false
  }
}

// Complete form (mark as completed and send to webhook)
export async function completeForm(
  formId: string,
  data: FormData
): Promise<boolean> {
  try {
    // Prepare webhook data
    const webhookData = {
      clientName: sanitizeText(data.clientName),
      meetingDate: data.meetingDate,
      participants: data.participants.map(p => ({
        name: sanitizeText(p.name),
        email: p.email,
        hebrewName: sanitizeText(p.hebrewName)
      })),
      creativeWriter: {
        name: sanitizeText(data.creativeWriter[0].name),
        email: data.creativeWriter[0].email,
        hebrewName: sanitizeText(data.creativeWriter[0].hebrewName)
      },
      presenter: {
        name: sanitizeText(data.presenter[0].name),
        email: data.presenter[0].email,
        hebrewName: sanitizeText(data.presenter[0].hebrewName)
      },
      presentationMaker: {
        name: sanitizeText(data.presentationMaker[0].name),
        email: data.presentationMaker[0].email,
        hebrewName: sanitizeText(data.presentationMaker[0].hebrewName)
      },
      accountManager: {
        name: sanitizeText(data.accountManager[0].name),
        email: data.accountManager[0].email,
        hebrewName: sanitizeText(data.accountManager[0].hebrewName)
      },
      aboutBrand: sanitizeText(data.aboutBrand),
      targetAudiences: sanitizeText(data.targetAudiences),
      goals: sanitizeText(data.goals),
      insight: sanitizeText(data.insight),
      strategy: sanitizeText(data.strategy),
      creative: sanitizeText(data.creative),
      influencersExample: sanitizeText(data.influencersExample || ''),
      additionalNotes: sanitizeText(data.additionalNotes || ''),
      budgetDistribution: sanitizeText(data.budgetDistribution || ''),
      creativeDeadline: data.creativeDeadline,
      internalDeadline: data.internalDeadline,
      clientDeadline: data.clientDeadline,
    }

    // Send to webhook
    const response = await fetch('https://hook.eu2.make.com/uryu3mv7m9tu3dtbkqto6qfdbnrdbjr0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    })

    if (!response.ok) throw new Error('Webhook failed')

    const supabase = getClient()
    // Update form status to completed
    const { error } = await supabase
      .from('forms')
      .update({ status: 'completed' })
      .eq('id', formId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error completing form:', error)
    return false
  }
}

// Get all contacts
export async function getContacts(): Promise<Contact[]> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('hebrew_first_name')

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting contacts:', error)
    return []
  }
}

// Subscribe to form changes
export function subscribeToForm(formId: string, callback: (payload: any) => void) {
  const supabase = getClient()
  const channel = supabase
    .channel(`form:${formId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inner_meeting_forms',
        filter: `form_id=eq.${formId}`
      },
      callback
    )
    .subscribe()

  return channel
}

// Subscribe to forms list changes
export function subscribeToFormsList(callback: (payload: any) => void) {
  const supabase = getClient()
  const channel = supabase
    .channel('forms_list')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'forms'
      },
      callback
    )
    .subscribe()

  return channel
}

// Unsubscribe from channel
export function unsubscribe(channel: any) {
  const supabase = getClient()
  supabase.removeChannel(channel)
}

