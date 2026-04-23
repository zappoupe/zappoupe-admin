import { useState, useEffect } from 'react';
import styles from './PaymentStatementsTable.module.css';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type Payment = {
  id: string;
  user_id: string;
  plano: string;
  valor: number;
  data_pagamento: string;
  stripe_invoice_id: string;
};

interface PaymentStatementsTableProps {
  filters: { startDate: Date | null; endDate: Date | null };
}

export default function PaymentStatementsTable({ filters }: PaymentStatementsTableProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        let query = supabase
          .from('extrato')
          .select('*')
          .order('data_pagamento', { ascending: false });

        if (filters.startDate) {
          query = query.gte('data_pagamento', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('data_pagamento', filters.endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [filters]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Extrato de Pagamentos</h3>
        <div className={styles.actions}>
          <button className={styles.btn}><Download size={16} /> CSV</button>
          <button className={styles.btn}><FileText size={16} /> PDF</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID Fatura</th>
                <th>Plano</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id}>
                  <td className={styles.user}>{pay.stripe_invoice_id || 'N/A'}</td>
                  <td className={styles.product}>{pay.plano === 'family' ? 'Família' : pay.plano === 'individual' ? 'Individual' : pay.plano}</td>
                  <td>{new Date(pay.data_pagamento).toLocaleDateString('pt-BR')}</td>
                  <td className={styles.amount}>R$ {Number(pay.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td><button className={styles.downloadIcon}><Download size={16} /></button></td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum pagamento encontrado.
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
