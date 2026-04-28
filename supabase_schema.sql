-- SCHEMA DE MIGRAÇÃO PARA OPINTEL (SUPABASE)
-- Execute este script no SQL Editor do seu Dashboard Supabase.

-- 1. Habilitar EXTENSÕES (opcional, já costumam vir habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: Membros da Equipe (team_members)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    sector TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'Ativo',
    performance_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: Demandas Operacionais (demands)
CREATE TABLE IF NOT EXISTS public.demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    priority TEXT NOT NULL DEFAULT 'MEDIA',
    sector TEXT NOT NULL,
    responsible_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    deadline BIGINT, -- Timestamp em milissegundos conforme app
    "date" TEXT,      -- Campo de data legível
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO (Padrão para usuários autenticados)
-- Nota: Para Produção, refine estas políticas conforme sua estrutura de permissões.

-- Políticas para team_members
CREATE POLICY "Acesso Total para Usuários Autenticados" 
ON public.team_members FOR ALL 
TO authenticated 
USING (true);

-- Políticas para demands
CREATE POLICY "Acesso Total para Usuários Autenticados" 
ON public.demands FOR ALL 
TO authenticated 
USING (true);

-- 6. TRIGGERS PARA UPDATED_AT (Opcional, mantém os timestamps sincronizados)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER update_demands_updated_at
    BEFORE UPDATE ON public.demands
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- 7. DADOS INICIAIS (Opcional - Semente de Equipe)
-- INSERT INTO public.team_members (name, role, sector) VALUES 
-- ('Carlos Silva', 'Operador Senior', 'Manutenção'),
-- ('Ana Souza', 'Analista de Infra', 'TI');
