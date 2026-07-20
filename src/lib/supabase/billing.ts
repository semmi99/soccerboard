import { supabase } from './client'

async function invokeForUrl(functionName: 'stripe-checkout' | 'stripe-portal'): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(functionName, {
    body: {},
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('Keine Weiterleitungs-URL erhalten.')
  return data.url
}

export async function startCheckout(): Promise<string> {
  return invokeForUrl('stripe-checkout')
}

export async function openBillingPortal(): Promise<string> {
  return invokeForUrl('stripe-portal')
}
