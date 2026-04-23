import { useState, FormEvent } from 'react';
import styles from './AddUserModal.module.css';
import { X, User, Phone, CreditCard, Calendar, Check, Loader2, Mail, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    plano_vitalicio: false,
    usuario_teste: false,
    dias_teste: '7',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('admin_users')
        .insert([
          {
            id: crypto.randomUUID(),
            nome: formData.nome,
            email: formData.email,
            celular: formData.telefone,
            plano_vitalicio: formData.plano_vitalicio,
            usuario_teste: formData.usuario_teste,
            dias_teste: formData.usuario_teste ? parseInt(formData.dias_teste) || 0 : 0,
            ativo: true,
          }
        ]);
      
      if (error) throw error;

      if (onUserAdded) onUserAdded();
      onClose();
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        plano_vitalicio: false,
        usuario_teste: false,
        dias_teste: '7',
      });
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário: ' + (error.message || 'Verifique a tabela admin_users no Supabase'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Adicionar Administrador</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nome Completo</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.icon} />
              <input 
                type="text" 
                placeholder="Ex: João Silva" 
                required 
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.icon} />
              <input 
                type="email" 
                placeholder="joao@exemplo.com" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Número de Telefone</label>
            <div className={styles.inputWrapper}>
              <Phone size={18} className={styles.icon} />
              <input 
                type="text" 
                placeholder="(00) 00000-0000" 
                required 
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.adminFields}>
            <div className={styles.toggles}>
              <label className={styles.toggleWrapper}>
                <input 
                  type="checkbox" 
                  checked={formData.plano_vitalicio}
                  onChange={(e) => setFormData({ ...formData, plano_vitalicio: e.target.checked })}
                />
                <span className={styles.slider}></span>
                <span className={styles.toggleLabel}>Plano Vitalício</span>
              </label>

              <label className={styles.toggleWrapper}>
                <input 
                  type="checkbox" 
                  checked={formData.usuario_teste}
                  onChange={(e) => setFormData({ ...formData, usuario_teste: e.target.checked })}
                />
                <span className={styles.slider}></span>
                <span className={styles.toggleLabel}>Usuário Teste</span>
              </label>
            </div>

            {formData.usuario_teste && (
              <div className={`${styles.inputGroup} ${styles.fadeIn}`}>
                <label>Dias de Teste</label>
                <div className={styles.inputWrapper}>
                  <Calendar size={18} className={styles.icon} />
                  <input 
                    type="number" 
                    placeholder="Ex: 7" 
                    min="1"
                    value={formData.dias_teste}
                    onChange={(e) => setFormData({ ...formData, dias_teste: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 size={18} className={styles.spinning} /> : <Check size={18} />}
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
