import styles from './Sidebar.module.css';
import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Painel', id: 'Painel' },
    { icon: <Users size={20} />, label: 'Usuários', id: 'Usuários' },
    { icon: <FileText size={20} />, label: 'Relatórios', id: 'Relatórios' },
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logo}>
        <h1>Zappoupe</h1>
        <span>Admin</span>
      </div>
      
      <nav className={styles.nav}>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className={activePage === item.id ? styles.active : ''}>
              <button onClick={() => handleNavigate(item.id)} className={styles.navBtn}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleSignOut}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
