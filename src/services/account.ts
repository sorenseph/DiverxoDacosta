import { supabase } from '@/services/supabase'

export async function currentUser(): Promise<{ id: string; email: string } | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user?.email) return null
  return { id: user.id, email: user.email }
}

export async function ensureAccount(email: string, password: string, fullName: string): Promise<{ ok: true; userId: string | null } | { ok: false; message: string }> {
  if (!supabase) return { ok: true, userId: null }
  const existing = await currentUser()
  if (existing && existing.email.toLowerCase() === email.trim().toLowerCase()) {
    return { ok: true, userId: existing.id }
  }
  if (password.trim().length < 6) {
    return { ok: false, message: 'Escribe una contraseña de al menos 6 caracteres para crear tu cuenta.' }
  }
  const signedUp = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  })
  if (signedUp.error) {
    const signedIn = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signedIn.error || !signedIn.data.user) {
      return { ok: false, message: 'No pudimos crear ni abrir la cuenta. Revisa el correo y la contraseña.' }
    }
    return { ok: true, userId: signedIn.data.user.id }
  }
  return { ok: true, userId: signedUp.data.user?.id ?? null }
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Supabase no está configurado.'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  return error ? 'Correo o contraseña incorrectos.' : null
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
