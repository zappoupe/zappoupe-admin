import { useState, FormEvent } from 'react';
import styles from './AddUserModal.module.css';
import { X, User, Phone, Check, Loader2, Mail, Calendar, ArrowLeft, Send, Lock } from 'lucide-react';
import { adminSupabase } from '../../../lib/supabase';
import { purgeAdminByEmail } from '../../../lib/adminUserService';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded?: () => void;
}

const defaultForm = {
  nome: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
  plano_vitalicio: false,
  usuario_teste: false,
  dias_teste: '7',
};

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState(defaultForm);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setFormData(defaultForm);
    onClose();
  };

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (formData.senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // "Refaz do zero": remove qualquer admin/conta de login pre-existente com esse
      // email antes de recriar. Resolve o duplicate key (admin_users_email_key) e o
      // "user already registered" do Auth de uma vez.
      await purgeAdminByEmail(formData.email);

      // Cria a conta de login JA com a senha definida (email_confirm:true => sem email).
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: formData.email,
        password: formData.senha,
        email_confirm: true,
        app_metadata: { role: 'admin' },
        user_metadata: { nome: formData.nome, celular: formData.telefone },
      });
      if (authError) throw authError;

      const { error: dbError } = await adminSupabase
        .from('admin_users')
        .insert([
          {
            id: authData?.user?.id || crypto.randomUUID(),
            nome: formData.nome,
            email: formData.email,
            celular: formData.telefone,
            plano_vitalicio: formData.plano_vitalicio,
            usuario_teste: formData.usuario_teste,
            dias_teste: formData.usuario_teste ? parseInt(formData.dias_teste) || 0 : 0,
            ativo: true,
            // Perfil padrão
            renda_mensal: 0,
            faixa_renda: '0-1000',
            personalidade_bot: 'friendly',
            proatividade_bot: 'medium',
            dicas_economia: true,
            sugestoes_excedente: true,
            economia_automatica: false,
            metas: [],
          },
        ]);
      if (dbError) throw dbError;

      if (onUserAdded) onUserAdded();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao criar administrador:', error);
      alert('Erro ao criar administrador: ' + (error.message || 'Verifique as configurações'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{step === 1 ? 'Adicionar Administrador' : 'Confirmar Criação'}</h3>
          <div className={styles.headerRight}>
            <div className={styles.stepDots}>
              <span className={`${styles.stepDot} ${styles.stepDotActive}`} />
              <span className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : ''}`} />
            </div>
            <button onClick={handleClose} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className={styles.form}>
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

            <div className={styles.inputGroup}>
              <label>Senha de Acesso</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.icon} />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Confirmar Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.icon} />
                <input
                  type="password"
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
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
              <button type="button" onClick={handleClose} className={styles.cancelBtn}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitBtn}>
                Próximo
                <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </form>
        ) : (
          <div className={`${styles.confirmStep} ${styles.fadeIn}`}>
            <div className={styles.inviteIconWrapper}>
              <Send size={22} />
            </div>

            <p className={styles.confirmInfo}>
              A conta será criada com a senha definida. O novo administrador já pode entrar
              direto com o e-mail e a senha — sem precisar de e-mail de convite.
            </p>

            <div className={styles.confirmCard}>
              <div className={styles.confirmRow}>
                <User size={15} className={styles.confirmRowIcon} />
                <div className={styles.confirmRowContent}>
                  <span className={styles.confirmRowLabel}>Nome</span>
                  <span className={styles.confirmRowValue}>{formData.nome}</span>
                </div>
              </div>
              <div className={styles.confirmRow}>
                <Mail size={15} className={styles.confirmRowIcon} />
                <div className={styles.confirmRowContent}>
                  <span className={styles.confirmRowLabel}>Email</span>
                  <span className={styles.confirmRowValue}>{formData.email}</span>
                </div>
              </div>
              <div className={styles.confirmRow}>
                <Phone size={15} className={styles.confirmRowIcon} />
                <div className={styles.confirmRowContent}>
                  <span className={styles.confirmRowLabel}>Telefone</span>
                  <span className={styles.confirmRowValue}>{formData.telefone}</span>
                </div>
              </div>

              {(formData.plano_vitalicio || formData.usuario_teste) && (
                <div className={styles.optionBadges}>
                  {formData.plano_vitalicio && (
                    <span className={styles.badge}>Plano Vitalício</span>
                  )}
                  {formData.usuario_teste && (
                    <span className={styles.badge}>{formData.dias_teste} dias de teste</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className={styles.backBtn}
                disabled={loading}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className={styles.spinning} /> : <Check size={18} />}
                {loading ? 'Criando...' : 'Confirmar e Criar Conta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
