import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './page.module.css';
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // O redirecionamento será tratado pelo App.tsx ao detectar a mudança de estado
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <ShieldCheck size={40} className={styles.logoIcon} />
          </div>
          <h1>Admin Dashboard</h1>
          <p>Entre com suas credenciais para acessar o painel</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.icon} />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.icon} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.loginButton} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className={styles.spinner} />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Entrar no Painel
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>&copy; 2026 Admin Panel. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
