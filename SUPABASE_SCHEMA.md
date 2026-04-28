# Supabase Setup

Crie as seguintes tabelas no seu projeto Supabase:

## 1. Tabela `demands`
```sql
create table demands (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  sector text,
  priority text,
  status text default 'Aguardando',
  date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);
```

## 2. Tabela `team_members`
```sql
create table team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  sector text,
  status text default 'Ativo',
  tasks integer default 0,
  performance integer default 100,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```
