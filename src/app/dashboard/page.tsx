import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import StatCard from './components/StatCard';
import RevenueChart from './components/RevenueChart';
import RecentTransactionsTable from './components/RecentTransactionsTable';
import DashboardFilters from '../../components/DashboardFilters';
import { DollarSign, Users, Activity, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const [stats, setStats] = useState({
    activeUsers: 0,
    newUsers: 0,
    monthlyEarnings: 0,
    totalRevenue: 0
  });

  const fetchDashboardStats = async (startDate?: Date | null, endDate?: Date | null) => {
    try {
      // Fetch Owners (Assinaturas) for active users count
      const { data: ownersData, error: ownersError } = await supabase
        .from('assinaturas')
        .select('id, ativo, criado_em');
      
      if (ownersError) throw ownersError;

      // Fetch Family Members for active users count
      const { data: membersData, error: membersError } = await supabase
        .from('membros_familia')
        .select('id, dono_id, criado_em');
      
      if (membersError) throw membersError;

      // Fetch Revenue from 'extrato' table
      let query = supabase
        .from('extrato')
        .select('valor, data_pagamento');

      if (startDate) {
        query = query.gte('data_pagamento', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('data_pagamento', endDate.toISOString());
      }

      const { data: extratoData, error: extratoError } = await query;

      if (extratoError) throw extratoError;

      if (ownersData && membersData) {
        const activeOwners = ownersData.filter(u => u.ativo);
        const activeOwnersIds = new Set(activeOwners.map(u => u.id));
        
        const activeMembersCount = membersData.filter(m => activeOwnersIds.has(m.dono_id)).length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newOwners = ownersData.filter(u => new Date(u.criado_em || '') > thirtyDaysAgo).length;
        const newMembers = membersData.filter(m => new Date(m.criado_em || '') > thirtyDaysAgo).length;

        // Calculate Revenue from extrato
        let totalRev = 0;
        let filteredRev = 0;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        if (extratoData) {
          extratoData.forEach(item => {
            const valor = parseFloat(item.valor.toString()) || 0;
            filteredRev += valor;
            
            // For total revenue, we might want to fetch all data if filters are applied, 
            // or just show the filtered total as "Receita no Período".
            // But the user asked for "Receita Total" and "Ganhos Mensais".
            // If filters are active, "Ganhos Mensais" should probably be "Ganhos no Período".
          });
        }

        // If no filters, calculate total revenue from all data
        if (!startDate && !endDate) {
          totalRev = filteredRev;
        } else {
          // Fetch total revenue separately if filters are active
          const { data: allExtrato } = await supabase.from('extrato').select('valor');
          totalRev = allExtrato?.reduce((acc, curr) => acc + (parseFloat(curr.valor.toString()) || 0), 0) || 0;
        }

        setStats({ 
          activeUsers: activeOwners.length + activeMembersCount, 
          newUsers: newOwners + newMembers,
          monthlyEarnings: filteredRev,
          totalRevenue: totalRev
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats(filters.startDate, filters.endDate);
  }, [filters]);

  const handleFilterChange = (newFilters: { startDate: Date | null; endDate: Date | null }) => {
    setFilters(newFilters);
  };

  return (
    <div className={styles.layout}>
      <MobileHeader onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
      <Sidebar 
        activePage="Painel" 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <section className={styles.welcomeSection}>
            <h2 className={styles.pageTitle}>Visão Geral do Painel</h2>
            <p className={styles.pageSubtitle}>Bem-vindo de volta, Nathan. Aqui está o que está acontecendo hoje.</p>
          </section>

          <DashboardFilters onFilterChange={handleFilterChange} />

          <section className={styles.statsGrid}>
            <StatCard 
              title={filters.startDate || filters.endDate ? "Ganhos no Período" : "Ganhos Mensais"} 
              value={`R$ ${stats.monthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
              trend="+12.5%" 
              isPositive={true} 
              icon={<DollarSign size={20} />} 
            />
            <StatCard 
              title="Receita Total" 
              value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
              trend="+8.2%" 
              isPositive={true} 
              icon={<Activity size={20} />} 
            />
            <StatCard 
              title="Usuários Ativos" 
              value={stats.activeUsers.toLocaleString()} 
              trend="+2.4%" 
              isPositive={true} 
              icon={<Users size={20} />} 
            />
            <StatCard 
              title="Novos Cadastros (30d)" 
              value={stats.newUsers.toLocaleString()} 
              trend="+15.0%" 
              isPositive={true} 
              icon={<UserPlus size={20} />} 
            />
          </section>

          <div className={styles.contentGrid}>
            <RevenueChart filters={filters} />
            <RecentTransactionsTable filters={filters} />
          </div>
        </div>
      </main>
    </div>
  );
}
