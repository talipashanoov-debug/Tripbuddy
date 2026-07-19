import { supabase } from './supabaseClient'

// Thin wrapper around supabase.functions.invoke that surfaces the JSON
// `error` message from non-2xx responses (which live on error.context,
// a Response object) instead of the generic "non-2xx status code" text.
export async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let message = error.message
    if (error.context && typeof error.context.json === 'function') {
      try {
        const parsed = await error.context.json()
        if (parsed?.error) message = parsed.error
      } catch {
        /* keep the default message */
      }
    }
    return { data: null, error: message }
  }

  return { data, error: null }
}
