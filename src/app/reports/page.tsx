import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import RevenueSummary from './components/RevenueSummary';
import PaymentStatementsTable from './components/PaymentStatementsTable';
import DashboardFilters from '../../components/DashboardFilters';

export default function ReportsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

  const handleFilterChange = (newFilters: { startDate: Date | null; endDate: Date | null }) => {
    setFilters(newFilters);
  };

  return (
    <div className={styles.layout}>
      <MobileHeader onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
      <Sidebar 
        activePage="Relatórios" 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <section className={styles.welcomeSection}>
            <h2 className={styles.pageTitle}>Relatórios Financeiros</h2>
            <p className={styles.pageSubtitle}>Acompanhe o faturamento geral e o extrato detalhado de pagamentos.</p>
          </section>

          <DashboardFilters onFilterChange={handleFilterChange} />

          <RevenueSummary filters={filters} />
          
          <div className={styles.tableWrapper}>
            <PaymentStatementsTable filters={filters} />
          </div>
        </div>
      </main>
    </div>
  );
}
