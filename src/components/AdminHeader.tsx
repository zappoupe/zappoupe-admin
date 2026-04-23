import styles from './AdminHeader.module.css';
import { Bell, Search, User } from 'lucide-react';

export default function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input type="text" placeholder="Buscar dados, usuários, transações..." />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn}>
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        
        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>Nathan Alfa</p>
            <p className={styles.userRole}>Super Administrador</p>
          </div>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
