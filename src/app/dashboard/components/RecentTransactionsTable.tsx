import { useState, useEffect } from 'react';
import styles from './RecentTransactionsTable.module.css';
import { supabase } from '../../../lib/supabase';

type Transaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  user?: {
    nome: string;
  };
};

interface RecentTransactionsTableProps {
  filters: { startDate: Date | null; endDate: Date | null };
}

export default function RecentTransactionsTable({ filters }: RecentTransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        let query = supabase
          .from('extrato')
          .select('id, valor, data_pagamento, plano')
          .order('data_pagamento', { ascending: false })
          .limit(5);

        if (filters.startDate) {
          query = query.gte('data_pagamento', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('data_pagamento', filters.endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setTransactions(data?.map(item => ({
          id: item.id,
          user_id: '', 
          description: `Plano ${item.plano === 'family' ? 'Família' : item.plano === 'individual' ? 'Individual' : item.plano || 'Assinatura'}`,
          amount: parseFloat(item.valor.toString()) || 0,
          type: 'income',
          date: item.data_pagamento
        })) || []);
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters]);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Transações Recentes</h3>
        <button className={styles.viewAll}>Ver Tudo</button>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID da Transação</th>
                <th>Usuário</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.id}>{tx.id.slice(0, 8)}...</td>
                  <td className={styles.user}>{tx.description || 'Usuário'}</td>
                  <td>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td className={styles.amount}>
                    {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`${styles.status} ${tx.type === 'income' ? styles.concluído : styles.falhou}`}>
                      {tx.type === 'income' ? 'Crédito' : 'Débito'}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
