-- Backstage Languages: database su Supabase.
-- Da eseguire una volta in Supabase → SQL Editor (si può rieseguire senza perdere dati).
--
-- Solo il server del sito accede ai dati, con la chiave service_role: RLS è attiva senza regole e le
-- funzioni sono eseguibili solo da service_role, quindi la chiave pubblica "anon" non legge né scrive nulla.
-- Le regole su chi vede cosa (studente / genitore / personale) sono nel codice: src/server/access.ts.

-- Contenuti modificabili del sito (una riga). `version` evita che due salvataggi si sovrascrivano.
create table if not exists public.site_content (
  id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Dati dell'area riservata: account, studenti, lezioni, progressi, appuntamenti, compiti, pagamenti,
-- promemoria, certificazioni, conversazioni condivise, richieste dal sito, file.
create table if not exists public.records (
  collection text not null check (collection in (
    'accounts', 'students', 'lessons', 'progress', 'appointments', 'assignments',
    'payments', 'reminders', 'certifications', 'shares', 'messages', 'files'
  )),
  id text not null,
  student_id text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists records_student on public.records (collection, student_id);
create index if not exists records_order on public.records (collection, created_at, id);

alter table public.site_content enable row level security;
alter table public.records enable row level security;
revoke all on public.site_content, public.records from anon, authenticated;

-- ---------- Funzioni usate dal server (src/server/store/supabase.ts) ----------

create or replace function public.bs_list(p_collection text) returns jsonb
language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(data order by created_at, id), '[]'::jsonb) from records where collection = p_collection
$$;

create or replace function public.bs_get(p_collection text, p_id text) returns jsonb
language sql stable set search_path = public as $$
  select data from records where collection = p_collection and id = p_id
$$;

create or replace function public.bs_insert(p_collection text, p_id text, p_data jsonb) returns void
language sql set search_path = public as $$
  insert into records (collection, id, student_id, data)
  values (p_collection, p_id, p_data ->> 'studentId', p_data || jsonb_build_object('id', p_id))
  on conflict (collection, id) do nothing
$$;

-- Unisce i campi di p_patch a quelli esistenti (stesso comportamento del deposito locale).
create or replace function public.bs_patch(p_collection text, p_id text, p_patch jsonb) returns jsonb
language sql set search_path = public as $$
  update records
     set data = data || p_patch || jsonb_build_object('id', p_id),
         student_id = (data || p_patch) ->> 'studentId',
         updated_at = now()
   where collection = p_collection and id = p_id
  returning data
$$;

create or replace function public.bs_delete(p_collection text, p_id text) returns void
language sql set search_path = public as $$
  delete from records where collection = p_collection and id = p_id
$$;

create or replace function public.bs_content_get() returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object('data', data, 'version', version) from site_content where id = 'main'
$$;

create or replace function public.bs_content_init(p_data jsonb) returns void
language sql set search_path = public as $$
  insert into site_content (id, data) values ('main', p_data) on conflict (id) do nothing
$$;

-- Salva solo se nessun altro ha salvato nel frattempo; restituisce la nuova versione o null.
create or replace function public.bs_content_put(p_expected integer, p_data jsonb) returns integer
language sql set search_path = public as $$
  update site_content set data = p_data, version = version + 1, updated_at = now()
   where id = 'main' and version = p_expected
  returning version
$$;

-- Toglie i dati dimostrativi (account e studenti "demo" e tutto ciò che li riguarda) quando il sito è pubblicato.
create or replace function public.bs_purge_demo() returns void
language sql set search_path = public as $$
  delete from records where student_id like 'stu_demo_%'
     or (collection in ('accounts', 'students') and (data ->> 'demo')::boolean is true)
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'bs_list(text)', 'bs_get(text, text)', 'bs_insert(text, text, jsonb)', 'bs_patch(text, text, jsonb)',
    'bs_delete(text, text)', 'bs_content_get()', 'bs_content_init(jsonb)', 'bs_content_put(integer, jsonb)', 'bs_purge_demo()'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ---------- STORAGE ----------
-- Due spazi file privati: "media" (foto del sito, servite da /api/media) e "private" (certificazioni,
-- servite da /api/files solo a chi ne ha diritto). Il sito accetta file fino a 4 MB, solo immagini e PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('private', 'private', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;
