import { supabase } from './client'

export async function sendContactMessage(input: {
  name: string
  email: string
  message: string
}): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name,
    email: input.email,
    message: input.message,
  })
  if (error) throw error
}
