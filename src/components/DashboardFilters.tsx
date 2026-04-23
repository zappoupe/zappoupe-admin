import { useState } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import styles from './dashboardfilters.module.css';

interface DashboardFiltersProps {
  onFilterChange: (filters: { startDate: Date | null; endDate: Date | null }) => void;
}

export default function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('');

  const handleQuickFilter = (filter: string) => {
    setActiveQuickFilter(filter);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'Hoje':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case '7 dias':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '30 dias':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'Este mês':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    onFilterChange({ startDate: start, endDate: end });
  };

  const handleApplyCustomFilter = () => {
    setActiveQuickFilter('');
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    onFilterChange({ startDate: start, endDate: end });
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setActiveQuickFilter('');
    onFilterChange({ startDate: null, endDate: null });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.wrapper}>
          
          {/* Quick Filters */}
          <div className={styles.quickFilters}>
            {['Hoje', '7 dias', '30 dias', 'Este mês'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                className={`${styles.quickFilterBtn} ${activeQuickFilter === filter ? styles.active : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          {/* Custom Range & Actions */}
          <div className={styles.customRange}>
            
            <div className={styles.inputsWrapper}>
              {/* Input Start Date */}
              <div className={styles.inputGroup}>
                <Calendar size={16} className={styles.inputIcon} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              
              <span className={styles.separator}>até</span>
              
              {/* Input End Date */}
              <div className={styles.inputGroup}>
                <Calendar size={16} className={styles.inputIcon} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleApplyCustomFilter}
                className={styles.filterBtn}
              >
                Filtrar
              </button>

              {(startDate || endDate || activeQuickFilter) && (
                <button
                  onClick={handleClear}
                  className={styles.clearBtn}
                  title="Limpar Filtros"
                >
                  <RotateCcw size={18} />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}