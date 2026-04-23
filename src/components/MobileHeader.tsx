import styles from './MobileHeader.module.css';
import { Menu, X } from 'lucide-react';

interface MobileHeaderProps {
  onToggle: () => void;
  isOpen: boolean;
}

export default function MobileHeader({ onToggle, isOpen }: MobileHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>Zappoupe</h1>
        <span>Admin</span>
      </div>
      <button onClick={onToggle} className={styles.toggleBtn}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
}
