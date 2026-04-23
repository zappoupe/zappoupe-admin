import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import UserTable from './components/UserTable';
import DashboardFilters from '../../components/DashboardFilters';
import { Users, UserCheck, UserMinus, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function UsersPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    family: 0,
    individual: 0
  });

  const fetchStats = async (startDate?: Date | null, endDate?: Date | null) => {
    try {
      // Fetch Owners
      let ownersQuery = supabase
        .from('assinaturas')
        .select('id, plano, ativo, criado_em');
      
      if (startDate) ownersQuery = ownersQuery.gte('criado_em', startDate.toISOString());
      if (endDate) ownersQuery = ownersQuery.lte('criado_em', endDate.toISOString());

      const { data: assinaturas, error: errorAssinaturas } = await ownersQuery;
      
      if (errorAssinaturas) throw errorAssinaturas;

      // Fetch Family Members
      let membersQuery = supabase
        .from('membros_familia')
        .select('id, dono_id, status, criado_em');

      if (startDate) membersQuery = membersQuery.gte('criado_em', startDate.toISOString());
      if (endDate) membersQuery = membersQuery.lte('criado_em', endDate.toISOString());
      
      const { data: membros, error: errorMembros } = await membersQuery;
      
      if (errorMembros) throw errorMembros;

      // Fetch Admins
      let adminsQuery = supabase
        .from('admin_users')
        .select('id, ativo, criado_em');
      
      if (startDate) adminsQuery = adminsQuery.gte('criado_em', startDate.toISOString());
      if (endDate) adminsQuery = adminsQuery.lte('criado_em', endDate.toISOString());

      const { data: admins } = await adminsQuery;

      if (assinaturas && membros) {
        const totalOwners = assinaturas.length;
        const totalMembers = membros.length;
        const totalAdmins = admins?.length || 0;
        
        const activeOwnersList = assinaturas.filter(u => u.ativo);
        const activeOwnersIds = new Set(activeOwnersList.map(u => u.id));
        
        const activeOwnersCount = activeOwnersList.length;
        const activeMembersCount = membros.filter(m => activeOwnersIds.has(m.dono_id)).length;
        const activeAdminsCount = admins?.filter(a => a.ativo).length || 0;

        const familyPlans = assinaturas.filter(u => u.plano === 'family' || u.plano === 'Família').length;
        const individualPlans = assinaturas.filter(u => u.plano === 'individual' || u.plano === 'Individual').length;

        setStats({ 
          total: totalOwners + totalMembers + totalAdmins, 
          active: activeOwnersCount + activeMembersCount + activeAdminsCount, 
          family: familyPlans, 
          individual: individualPlans 
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  useEffect(() => {
    fetchStats(filters.startDate, filters.endDate);
  }, [filters]);

  const handleFilterChange = (newFilters: { startDate: Date | null; endDate: Date | null }) => {
    setFilters(newFilters);
  };

  return (
    <div className={styles.layout}>
      <MobileHeader onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
      <Sidebar 
        activePage="Usuários" 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <section className={styles.welcomeSection}>
            <h2 className={styles.pageTitle}>Gerenciamento de Usuários</h2>
            <p className={styles.pageSubtitle}>Visualize e gerencie todos os clientes da plataforma Zappoupe.</p>
          </section>

          <DashboardFilters onFilterChange={handleFilterChange} />

          <section className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}><Users size={24} /></div>
              <div className={styles.summaryInfo}>
                <span>{filters.startDate || filters.endDate ? "Novos no Período" : "Total de Usuários"}</span>
                <h3>{stats.total.toLocaleString()}</h3>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}><UserCheck size={24} /></div>
              <div className={styles.summaryInfo}>
                <span>Usuários Ativos</span>
                <h3>{stats.active.toLocaleString()}</h3>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}><ShieldCheck size={24} /></div>
              <div className={styles.summaryInfo}>
                <span>Planos Família</span>
                <h3>{stats.family.toLocaleString()}</h3>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}><UserPlus size={24} /></div>
              <div className={styles.summaryInfo}>
                <span>Planos Individuais</span>
                <h3>{stats.individual.toLocaleString()}</h3>
              </div>
            </div>
          </section>

          <UserTable filters={filters} />
        </div>
      </main>
    </div>
  );
}
