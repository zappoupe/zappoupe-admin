import { useState, useEffect } from 'react';
import styles from './RevenueChart.module.css';
import { supabase } from '../../../lib/supabase';

interface RevenueChartProps {
  filters: { startDate: Date | null; endDate: Date | null };
}

export default function RevenueChart({ filters }: RevenueChartProps) {
  const [chartData, setChartData] = useState<{ month: string, value: number, percentage: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        let query = supabase
          .from('extrato')
          .select('valor, data_pagamento');

        if (filters.startDate) {
          query = query.gte('data_pagamento', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('data_pagamento', filters.endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const monthlyTotals: { [key: string]: number } = {};
          
          const now = new Date();
          const last7Months: { year: number, month: number, key: string }[] = [];

          // Inicializa os últimos 7 meses
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthlyTotals[key] = 0;
            last7Months.push({ year: d.getFullYear(), month: d.getMonth(), key });
          }

          data.forEach(item => {
            const d = new Date(item.data_pagamento);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthlyTotals[key] !== undefined) {
              monthlyTotals[key] += parseFloat(item.valor.toString()) || 0;
            }
          });

          const maxVal = Math.max(...Object.values(monthlyTotals), 1);
          
          const formattedData = last7Months.map(m => ({
            month: monthNames[m.month],
            value: monthlyTotals[m.key],
            percentage: (monthlyTotals[m.key] / maxVal) * 100
          }));

          setChartData(formattedData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [filters]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Visão Geral de Receita</h3>
        <select className={styles.select}>
          <option>Últimos 7 Meses</option>
        </select>
      </div>

      <div className={styles.chartArea}>
        {loading ? (
          <div className={styles.loading}>Carregando gráfico...</div>
        ) : (
          <div className={styles.bars}>
            {chartData.map((item, index) => (
              <div key={index} className={styles.barWrapper}>
                <div 
                  className={styles.bar} 
                  style={{ height: `${Math.max(item.percentage, 5)}%` }}
                >
                  <span className={styles.tooltip}>R$ {item.value.toLocaleString('pt-BR')}</span>
                </div>
                <span className={styles.label}>{item.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
