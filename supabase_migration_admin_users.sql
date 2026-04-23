-- Query para criar a tabela de Admin Users
-- Execute isso no seu SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    celular TEXT,
    plano_vitalicio BOOLEAN DEFAULT FALSE,
    usuario_teste BOOLEAN DEFAULT FALSE,
    dias_teste INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE
);

-- Habilitar RLS (Opcional, dependendo da sua configuração)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Exemplo de política simples (permite tudo para usuários logados)
-- CREATE POLICY "Permitir tudo para autenticados" ON public.admin_users
-- FOR ALL USING (auth.role() = 'authenticated');
