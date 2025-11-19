import { z } from 'zod'

export interface Contact {
  firstName: string
  lastName: string
  hebrewFirstName: string
  hebrewLastName: string
  email: string
}

export interface SelectedPerson {
  name: string // English name
  email: string
  hebrewName: string
}

export const formSchema = z.object({
  clientName: z.string().min(1, 'שדה חובה'),
  meetingDate: z.string().min(1, 'שדה חובה'),
  participants: z.array(z.object({
    name: z.string(),
    email: z.string(),
    hebrewName: z.string(),
  })).min(1, 'יש לבחור לפחות משתתף אחד'),
  creativeWriter: z.array(z.object({
    name: z.string(),
    email: z.string(),
    hebrewName: z.string(),
  })).min(1, 'שדה חובה'),
  presenter: z.array(z.object({
    name: z.string(),
    email: z.string(),
    hebrewName: z.string(),
  })).min(1, 'שדה חובה'),
  presentationMaker: z.array(z.object({
    name: z.string(),
    email: z.string(),
    hebrewName: z.string(),
  })).min(1, 'שדה חובה'),
  accountManager: z.array(z.object({
    name: z.string(),
    email: z.string(),
    hebrewName: z.string(),
  })).min(1, 'שדה חובה'),
  aboutBrand: z.string().min(1, 'שדה חובה'),
  targetAudiences: z.string().min(1, 'שדה חובה'),
  goals: z.string().min(1, 'שדה חובה'),
  insight: z.string().min(1, 'שדה חובה'),
  strategy: z.string().min(1, 'שדה חובה'),
  creative: z.string().min(1, 'שדה חובה'),
  influencersExample: z.string().optional(),
  additionalNotes: z.string().optional(),
  budgetDistribution: z.string().optional(),
  creativeDeadline: z.string().min(1, 'שדה חובה'),
  internalDeadline: z.string().min(1, 'שדה חובה'),
  clientDeadline: z.string().min(1, 'שדה חובה'),
})

export type FormData = z.infer<typeof formSchema>

