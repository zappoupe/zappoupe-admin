/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import DashboardPage from './app/dashboard/page';
import UsersPage from './app/users/page';
import ReportsPage from './app/reports/page';
import LoginPage from './app/login/page';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('Painel');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#153703' }} />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  // Verificar se o usuário tem a role de admin estritamente via metadados
  const isAdmin = session.user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Acesso Negado</h1>
        <p style={{ color: '#475569', marginBottom: '2rem' }}>Você não tem permissão de administrador para acessar este painel.</p>
        <button 
          onClick={() => supabase.auth.signOut()}
          style={{ 
            backgroundColor: '#153703', 
            color: 'white', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '0.5rem',
            fontWeight: '600'
          }}
        >
          Sair e entrar com outra conta
        </button>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Painel':
        return <DashboardPage onNavigate={setActivePage} />;
      case 'Usuários':
        return <UsersPage onNavigate={setActivePage} />;
      case 'Relatórios':
        return <ReportsPage onNavigate={setActivePage} />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <>
      {renderPage()}
    </>
  );
}
