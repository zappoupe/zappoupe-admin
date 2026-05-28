import { adminSupabase } from './supabase';

/**
 * Remove a conta de login (Supabase Auth) que tenha o email informado.
 * Pagina a lista de usuarios ate achar. No-op se nao existir.
 */
export async function deleteAuthUserByEmail(email: string): Promise<void> {
  const alvo = email.trim().toLowerCase();
  if (!alvo) return;

  const perPage = 1000;
  let page = 1;

  for (;;) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const encontrado = users.find((u) => u.email?.toLowerCase() === alvo);
    if (encontrado) {
      const { error: delError } = await adminSupabase.auth.admin.deleteUser(encontrado.id);
      if (delError) throw delError;
      return;
    }

    if (users.length < perPage) return; // ultima pagina, nao achou
    page += 1;
  }
}

/**
 * Remove COMPLETAMENTE um admin pelo email: linha em admin_users + conta de login.
 * Usa service role (bypass RLS). Idempotente — pode rodar mesmo se nao existir.
 */
export async function purgeAdminByEmail(email: string): Promise<void> {
  const alvo = email.trim();
  if (!alvo) return;

  const { error: dbError } = await adminSupabase.from('admin_users').delete().eq('email', alvo);
  if (dbError) throw dbError;

  await deleteAuthUserByEmail(alvo);
}

/**
 * Define uma nova senha para a conta de login (Supabase Auth) com o email informado.
 * Usado pelo reset de senha do painel (sem email). Lanca erro se o usuario nao existir.
 */
export async function resetPasswordByEmail(email: string, novaSenha: string): Promise<void> {
  const alvo = email.trim().toLowerCase();
  if (!alvo) throw new Error('E-mail invalido.');
  if (!novaSenha || novaSenha.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const encontrado = users.find((u) => u.email?.toLowerCase() === alvo);
    if (encontrado) {
      const { error: updError } = await adminSupabase.auth.admin.updateUserById(encontrado.id, {
        password: novaSenha,
      });
      if (updError) throw updError;
      return;
    }
    if (users.length < perPage) break;
    page += 1;
  }
  throw new Error('Conta de login não encontrada para este e-mail.');
}
