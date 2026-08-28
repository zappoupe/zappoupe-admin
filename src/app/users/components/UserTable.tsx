import { useState, useMemo, useEffect } from 'react';
import styles from './UserTable.module.css';
import { MoreVertical, CheckCircle, XCircle, Trash2, UserX, Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, KeyRound } from 'lucide-react';
import AddUserModal from './AddUserModal';
import { supabase, adminSupabase } from '../../../lib/supabase';
import { deleteAuthUserByEmail, resetPasswordByEmail } from '../../../lib/adminUserService';

type User = {
  id: string;
  nome: string;
  telefone: string;
  plano: string;
  ativo: boolean;
  is_anual: boolean;
  membros_extras: number;
  criado_em?: string;
  tipo: 'Dono' | 'Familiar' | 'Admin';
  // Admin specific fields
  plano_vitalicio?: boolean;
  usuario_teste?: boolean;
  dias_teste?: number;
  email?: string;
};

type SortConfig = {
  key: 'nome' | 'plano' | 'ativo' | 'tipo' | null;
  direction: 'asc' | 'desc';
};

interface UserTableProps {
  filters: { startDate: Date | null; endDate: Date | null };
}

export default function UserTable({ filters }: UserTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [resetTarget, setResetTarget] = useState<{ email: string; nome: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const calculateAmount = (user: User) => {
    if (user.tipo === 'Admin') {
      if (user.plano_vitalicio) return 'Plano Vitalício';
      if (user.usuario_teste) return `Teste (${user.dias_teste} dias)`;
      return 'S/ Assinatura';
    }
    if (user.tipo === 'Familiar') return 'Incluso';
    
    const isFamily = user.plano === 'family' || user.plano === 'Família';
    const isAnual = user.is_anual;
    const extras = user.membros_extras || 0;

    if (isFamily) {
      if (isAnual) {
        const total = 397.90 + (extras * 178.80);
        return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano`;
      } else {
        const total = 49.90 + (extras * 14.90);
        return `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`;
      }
    } else {
      if (isAnual) {
        return 'R$ 197,90/ano';
      } else {
        return 'R$ 24,90/mês';
      }
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch Owners
      let ownersQuery = supabase
        .from('assinaturas')
        .select('*');

      if (filters.startDate) ownersQuery = ownersQuery.gte('criado_em', filters.startDate.toISOString());
      if (filters.endDate) ownersQuery = ownersQuery.lte('criado_em', filters.endDate.toISOString());

      const { data: assinaturas, error: errorAssinaturas } = await ownersQuery;

      if (errorAssinaturas) throw errorAssinaturas;

      // Fetch Family Members
      let membersQuery = supabase
        .from('membros_familia')
        .select('*');

      if (filters.startDate) membersQuery = membersQuery.gte('criado_em', filters.startDate.toISOString());
      if (filters.endDate) membersQuery = membersQuery.lte('criado_em', filters.endDate.toISOString());

      const { data: membros, error: errorMembros } = await membersQuery;

      if (errorMembros) throw errorMembros;

      // Fetch Admin Users
      let adminsQuery = supabase
        .from('admin_users')
        .select('*');
      
      if (filters.startDate) adminsQuery = adminsQuery.gte('criado_em', filters.startDate.toISOString());
      if (filters.endDate) adminsQuery = adminsQuery.lte('criado_em', filters.endDate.toISOString());

      const { data: adminUsers, error: errorAdmins } = await adminsQuery;
      
      if (errorAdmins && errorAdmins.code !== 'PGRST116' && !errorAdmins.message.includes('relation "admin_users" does not exist')) {
        // Only throw if it's a real error, not just table missing
        console.warn('Tabela admin_users não encontrada ou erro no acesso. Execute o SQL fornecido.');
      }

      const owners: User[] = (assinaturas || []).map(u => ({
        ...u,
        tipo: 'Dono'
      }));

      const familyMembers: User[] = (membros || []).map(m => {
        // Find the owner to determine status
        const owner = assinaturas?.find(a => a.id === m.dono_id);
        return {
          id: m.id,
          nome: m.nome,
          telefone: m.telefone || '',
          email: m.email || '', // permite reset de senha do familiar
          plano: 'family',
          ativo: owner ? owner.ativo : false, // Status depends on owner
          is_anual: false,
          membros_extras: 0,
          criado_em: m.criado_em,
          tipo: 'Familiar'
        };
      });

      const admins: User[] = (adminUsers || []).map(a => ({
        ...a,
        telefone: a.celular || '',
        plano: a.plano_vitalicio ? 'Vitalício' : a.usuario_teste ? 'Teste' : 'Admin',
        is_anual: false,
        membros_extras: 0,
        tipo: 'Admin'
      }));

      const allUsers = [...owners, ...familyMembers, ...admins].sort((a, b) => {
        const dateA = new Date(a.criado_em || 0).getTime();
        const dateB = new Date(b.criado_em || 0).getTime();
        return dateB - dateA;
      });

      setUsers(allUsers);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        alert('Erro de autenticação ou RLS. Verifique se você está logado com o email admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const toggleStatus = async (id: string, currentStatus: boolean, tipo: 'Dono' | 'Familiar' | 'Admin') => {
    if (tipo === 'Familiar') {
      alert('O status do familiar é controlado pelo plano do dono.');
      setActiveMenu(null);
      return;
    }

    // Sem confirmacao, dois cliques errados no menu tiram o acesso de um
    // cliente pagante sem deixar rastro — foi assim que robson@zr3.com.br e
    // josueoliver1@hotmail.com ficaram com ativo=false e status=trialing,
    // combinacao que o webhook nunca gera e que custou caro pra diagnosticar.
    const acao = currentStatus ? 'DESATIVAR' : 'reativar';
    if (!window.confirm(`Tem certeza que deseja ${acao} este usuario?`)) {
      setActiveMenu(null);
      return;
    }

    try {
      const table = tipo === 'Dono' ? 'assinaturas' : 'admin_users';
      const { error } = await supabase
        .from(table)
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh all users to update family members status too
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
    setActiveMenu(null);
  };

  const deleteUser = async (id: string, tipo: 'Dono' | 'Familiar' | 'Admin', email?: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        let table = '';
        if (tipo === 'Dono') table = 'assinaturas';
        else if (tipo === 'Familiar') table = 'membros_familia';
        else table = 'admin_users';

        // Service role (adminSupabase) bypassa RLS — garante que o DELETE realmente
        // remove a linha (com anon key o RLS bloqueava silenciosamente).
        const { error } = await adminSupabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Admin tambem tem conta de login (Supabase Auth) — remove pra liberar o email.
        if (tipo === 'Admin' && email) {
          await deleteAuthUserByEmail(email);
        }

        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário: ' + ((error as any)?.message || 'tente novamente'));
      }
    }
    setActiveMenu(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPasswordByEmail(resetTarget.email, newPassword);
      alert(`Senha de ${resetTarget.nome} redefinida com sucesso!`);
      setResetTarget(null);
      setNewPassword('');
    } catch (error) {
      alert('Erro ao redefinir senha: ' + ((error as any)?.message || 'tente novamente'));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSort = (key: 'nome' | 'plano' | 'ativo' | 'tipo') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.nome?.toLowerCase().includes(lowerSearch)) || 
        (user.telefone?.includes(searchTerm))
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!] || '';
        const valB = b[sortConfig.key!] || '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, sortConfig]);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className={styles.sortIcon} />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={14} className={styles.sortIconActive} /> : 
      <ArrowDown size={14} className={styles.sortIconActive} />;
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>Lista de Usuários</h3>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou número..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button onClick={fetchUsers} className={styles.refreshBtn} title="Atualizar dados">
            <RefreshCw size={18} className={loading ? styles.spinning : ''} />
          </button>
          <button className={styles.exportBtn}>Exportar CSV</button>
          <button 
            className={styles.addBtn}
            onClick={() => setIsModalOpen(true)}
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading && users.length === 0 ? (
          <div className={styles.loadingState}>Carregando usuários...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('nome')} className={styles.sortableHeader}>
                  <div className={styles.headerContent}>
                    Nome {getSortIcon('nome')}
                  </div>
                </th>
                <th>Número</th>
                <th onClick={() => handleSort('tipo')} className={styles.sortableHeader}>
                  <div className={styles.headerContent}>
                    Tipo {getSortIcon('tipo')}
                  </div>
                </th>
                <th onClick={() => handleSort('plano')} className={styles.sortableHeader}>
                  <div className={styles.headerContent}>
                    Plano {getSortIcon('plano')}
                  </div>
                </th>
                <th onClick={() => handleSort('ativo')} className={styles.sortableHeader}>
                  <div className={styles.headerContent}>
                    Status {getSortIcon('ativo')}
                  </div>
                </th>
                <th>Valor Pago</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className={styles.userName}>{user.nome}</td>
                  <td className={styles.phone}>{user.telefone}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${
                      user.tipo === 'Dono' ? styles.owner : 
                      user.tipo === 'Familiar' ? styles.familyMember : 
                      styles.admin
                    }`}>
                      {user.tipo === 'Admin' ? 'ADMIN' : user.tipo}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.planBadge} ${
                      (user.plano === 'family' || user.plano === 'Família') ? styles.family : 
                      user.tipo === 'Admin' ? styles.adminPlan :
                      styles.individual
                    }`}>
                      {user.tipo === 'Admin' 
                        ? user.plano 
                        : (user.plano === 'family' ? 'Família' : user.plano === 'individual' ? 'Individual' : user.plano)
                      } 
                      {user.tipo === 'Dono' ? (user.is_anual ? '(Anual)' : '(Mensal)') : ''}
                    </span>
                  </td>
                  <td>
                    <div className={styles.statusWrapper}>
                      {user.ativo ? (
                        <CheckCircle size={16} className={styles.activeIcon} />
                      ) : (
                        <XCircle size={16} className={styles.inactiveIcon} />
                      )}
                      <span className={user.ativo ? styles.activeText : styles.inactiveText}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td className={styles.amount}>{calculateAmount(user)}</td>
                  <td className={styles.actionsCell}>
                    <button 
                      className={styles.moreBtn}
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenu === user.id && (
                      <div className={styles.actionMenu}>
                        <button onClick={() => toggleStatus(user.id, user.ativo, user.tipo)} className={styles.menuItem}>
                          <UserX size={16} />
                          {user.ativo ? 'Inativar' : 'Ativar'}
                        </button>
                        {user.email && (
                          <button
                            onClick={() => { setResetTarget({ email: user.email!, nome: user.nome }); setActiveMenu(null); }}
                            className={styles.menuItem}
                          >
                            <KeyRound size={16} />
                            Resetar senha
                          </button>
                        )}
                        <button onClick={() => deleteUser(user.id, user.tipo, user.email)} className={`${styles.menuItem} ${styles.delete}`}>
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={fetchUsers}
      />

      {resetTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => !resetLoading && setResetTarget(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', padding: '28px',
              width: '90%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#2e3d30' }}>
              <KeyRound size={20} /> Resetar Senha
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 18px' }}>
              Definindo nova senha para <strong>{resetTarget.nome}</strong> ({resetTarget.email}).
            </p>

            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a634d' }}>Nova Senha</label>
            <input
              type="password"
              autoFocus
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px', marginTop: '6px',
                borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setResetTarget(null); setNewPassword(''); }}
                disabled={resetLoading}
                style={{
                  padding: '10px 18px', borderRadius: '6px', border: '1px solid #ccc',
                  background: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                style={{
                  padding: '10px 18px', borderRadius: '6px', border: 'none',
                  background: '#89b321', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {resetLoading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
