-- ─────────────────────────────────────────────────────────────
-- 피싱체크 회원 데이터 (Supabase → SQL Editor 에 붙여넣고 Run 한 번)
-- 여러 번 실행해도 안전하도록 작성했습니다.
-- ─────────────────────────────────────────────────────────────

-- 1) 프로필 (닉네임·동의 기록)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 12),
  marketing_opt_in boolean not null default false,
  terms_agreed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 2) 즐겨찾기 포인트
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id text not null check (char_length(spot_id) <= 64),
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);
alter table public.favorites enable row level security;
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 3) 조과 기록 (앱의 기록 1건을 JSON 그대로 저장, 사진은 줄인 data URL)
create table if not exists public.catch_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (char_length(id) <= 40),
  data jsonb not null check (pg_column_size(data) < 400000),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.catch_logs enable row level security;
drop policy if exists "catch_logs_own" on public.catch_logs;
create policy "catch_logs_own" on public.catch_logs for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 4) 가입하면 프로필 자동 생성 (이메일 가입: 입력한 닉네임 / 카카오: 카카오 닉네임)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nick text := left(trim(coalesce(
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    ''
  )), 12);
begin
  if char_length(nick) < 2 then
    nick := '낚시인' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;
  insert into public.profiles (id, nickname, marketing_opt_in, terms_agreed_at)
  values (
    new.id,
    nick,
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    nullif(new.raw_user_meta_data ->> 'terms_agreed_at', '')::timestamptz
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) (v1.6) 낚시점 사장님께 들은 조황 — 누구나 읽고, 로그인한 사람만 쓰고, 쓴 사람만 지움
create table if not exists public.shop_tips (
  id uuid primary key default gen_random_uuid(),
  spot_id text not null check (char_length(spot_id) <= 64),
  shop_name text not null check (char_length(shop_name) between 1 and 40),
  species text[] not null default '{}',
  content text not null check (char_length(content) between 5 and 300),
  heard_on date not null default current_date,
  author uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nickname text check (char_length(nickname) <= 12),
  created_at timestamptz not null default now()
);
create index if not exists shop_tips_spot_idx on public.shop_tips (spot_id, heard_on desc);
alter table public.shop_tips enable row level security;
drop policy if exists "shop_tips_read_all" on public.shop_tips;
create policy "shop_tips_read_all" on public.shop_tips for select using (true);
drop policy if exists "shop_tips_insert_own" on public.shop_tips;
create policy "shop_tips_insert_own" on public.shop_tips for insert with check ((select auth.uid()) = author);
drop policy if exists "shop_tips_delete_own" on public.shop_tips;
create policy "shop_tips_delete_own" on public.shop_tips for delete using ((select auth.uid()) = author);
