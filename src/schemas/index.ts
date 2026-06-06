import { z } from 'zod'

export const OrgTypeSchema = z.enum(['school', 'nonprofit', 'business', 'government', 'startup'])

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  type: OrgTypeSchema,
  created_by: z.string(),
  created_at: z.string(),
  school_district: z.string().optional(),
  nonprofit_ein: z.string().optional(),
  business_reg_number: z.string().optional(),
})

export const OrgMemberSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  user_id: z.string(),
  email: z.string().email('Invalid email address'),
  status: z.enum(['invited', 'active']),
  role: z.enum(['admin', 'member']),
  invited_at: z.string(),
  joined_at: z.string().optional(),
})

export const ProfileSchema = z.object({
  id: z.string(),
  full_name: z.string().min(1, 'Full name is required'),
  is_admin: z.boolean(),
})

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const SignUpFormSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type SignInValues = z.infer<typeof SignInSchema>
export type SignUpFormValues = z.infer<typeof SignUpFormSchema>
