-- ============================================
-- BildenEdu Agent - 数据库建表 SQL
-- 请在 Supabase Dashboard → SQL Editor 中运行
-- ============================================

-- 1. 对话表：每个对话是一次独立的愿景工坊
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  family_code text not null default '',
  title text not null default '新对话',
  status text not null default 'active' check (status in ('active', 'archived')),
  current_module int not null default 0,
  current_node int not null default 0,
  started boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. 消息表：对话中的所有消息（AI + 用户 + 卡片）
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('ai', 'user')),
  content text not null default '',
  card_type text,
  card_props jsonb,
  card_data jsonb,
  snapshot_content text,
  created_at timestamptz default now() not null
);

-- 3. 罗盘数据表：每个对话生成的罗盘报告数据
create table compass_data (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null unique,
  data jsonb not null default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- 索引
-- ============================================

-- 历史列表：按 updated_at 倒序排列
create index idx_conversations_user_updated
  on conversations(user_id, updated_at desc);

-- 只查 active 对话（排除 archived）
create index idx_conversations_user_status
  on conversations(user_id, status) where status = 'active';

-- 消息查询
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_created_at on messages(conversation_id, created_at);

-- ============================================
-- RLS（行级安全）：用户只能看到自己的数据
-- ============================================

alter table conversations enable row level security;
alter table messages enable row level security;
alter table compass_data enable row level security;

-- conversations: 用户只能 CRUD 自己的对话
create policy "Users can view own conversations"
  on conversations for select using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on conversations for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on conversations for update using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on conversations for delete using (auth.uid() = user_id);

-- messages: 用户只能访问自己对话中的消息
create policy "Users can view own messages"
  on messages for select using (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

create policy "Users can create messages in own conversations"
  on messages for insert with check (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

-- compass_data: 用户只能访问自己的罗盘数据
create policy "Users can view own compass data"
  on compass_data for select using (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

create policy "Users can upsert own compass data"
  on compass_data for insert with check (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

create policy "Users can update own compass data"
  on compass_data for update using (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

-- ============================================
-- 自动更新 updated_at
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

create trigger compass_data_updated_at
  before update on compass_data
  for each row execute function update_updated_at();

-- ============================================
-- 自动归档：新建对话时，如果 active 对话超过 5 个，
-- 自动把最旧的归档（soft delete）
-- ============================================

create or replace function auto_archive_old_conversations()
returns trigger as $$
begin
  -- 把该用户超出 5 个的 active 对话按 updated_at 旧的归档
  -- 显式排除刚插入的 new.id，避免误归档当前新建对话
  update conversations
  set status = 'archived'
  where id in (
    select id from conversations
    where user_id = new.user_id
      and status = 'active'
      and id != new.id
    order by updated_at desc
    offset 4
  );
  return new;
end;
$$ language plpgsql;

create trigger auto_archive_on_insert
  after insert on conversations
  for each row execute function auto_archive_old_conversations();
