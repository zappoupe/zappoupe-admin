import { useState, useEffect } from 'react';
import styles from './RevenueSummary.module.css';
import { TrendingUp, DollarSign, CreditCard, Wallet } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface RevenueSummaryProps {
  filters: { startDate: Date | null; endDate: Date | null };
}

export default function RevenueSummary({ filters }: RevenueSummaryProps) {
  const [stats, setStats] = useState({
    total: 0,
    net: 0,
    avgTicket: 0,
    count: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let query = supabase
          .from('extrato')
          .select('valor');

        if (filters.startDate) {
          query = query.gte('data_pagamento', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('data_pagamento', filters.endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const total = data.reduce((acc, curr) => acc + Number(curr.valor), 0);
          const net = total * 0.95; // Assuming 5% fees
          const avgTicket = data.length > 0 ? total / data.length : 0;
          
          setStats({
            total,
            net,
            avgTicket,
            count: data.length
          });
        }
      } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
      }
    };

    fetchStats();
  }, [filters]);

  return (
    <section className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.icon}><DollarSign size={24} /></div>
        <div className={styles.info}>
          <span>Faturamento {filters.startDate || filters.endDate ? "no Período" : "Total"}</span>
          <h3>R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className={styles.trend}><TrendingUp size={14} /> Baseado em {stats.count} vendas</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.icon}><Wallet size={24} /></div>
        <div className={styles.info}>
          <span>Receita Líquida</span>
          <h3>R$ {stats.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className={styles.subtext}>Após taxas de processamento (estimado)</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.icon}><CreditCard size={24} /></div>
        <div className={styles.info}>
          <span>Ticket Médio</span>
          <h3>R$ {stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className={styles.subtext}>Média por transação</p>
        </div>
      </div>
    </section>
  );
}
