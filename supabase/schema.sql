-- Lovebirds — Supabase schema
-- Run in SQL Editor after creating project. Enable Realtime on marked tables.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('she', 'he')) DEFAULT 'she',
  food_vegetables TEXT[] DEFAULT '{}',
  food_fruits TEXT[] DEFAULT '{}',
  food_berries TEXT[] DEFAULT '{}',
  food_dishes TEXT[] DEFAULT '{}',
  chat_mode TEXT CHECK (chat_mode IN ('ephemeral', 'permanent')) DEFAULT 'ephemeral',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couples
CREATE TABLE public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  together_since DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending'
);

CREATE TABLE public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('a', 'b')) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (couple_id, user_id),
  UNIQUE (user_id)
);

-- Next meeting (one row per couple)
CREATE TABLE public.couple_meetings (
  couple_id UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  meeting_at TIMESTAMPTZ NOT NULL,
  set_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heart pulses (realtime)
CREATE TABLE public.heart_pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity ideas
CREATE TABLE public.activity_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Album
CREATE TABLE public.album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tic-tac-toe (realtime)
CREATE TABLE public.tic_tac_toe_games (
  couple_id UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  board TEXT[] DEFAULT ARRAY['', '', '', '', '', '', '', '', ''],
  current_turn UUID REFERENCES auth.users(id),
  player_x UUID REFERENCES auth.users(id),
  player_o UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('playing', 'won', 'draw')) DEFAULT 'playing',
  winner_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings (realtime)
CREATE TABLE public.savings_goals (
  couple_id UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  goal_name TEXT DEFAULT 'Наша мечта',
  target_amount NUMERIC(12, 2) DEFAULT 0,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Important dates
CREATE TABLE public.important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliments feed
CREATE TABLE public.compliments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily mood
CREATE TABLE public.daily_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  mood_date DATE DEFAULT CURRENT_DATE,
  UNIQUE (couple_id, user_id, mood_date)
);

-- Helper functions (SECURITY DEFINER — postgres bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.my_couple_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_couple_member(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.couple_has_slot(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 2 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

CREATE OR REPLACE FUNCTION public.user_has_couple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.partner_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm2.user_id
  FROM public.couple_members cm1
  JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
  WHERE cm1.user_id = auth.uid() AND cm2.user_id <> auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.couple_awaiting_partner(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) = 1 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

CREATE OR REPLACE FUNCTION public.couple_is_empty(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) = 0 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Dissolve couple (RPC)
CREATE OR REPLACE FUNCTION public.dissolve_couple()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id UUID;
BEGIN
  v_couple_id := my_couple_id();
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No couple found';
  END IF;

  DELETE FROM album_photos WHERE couple_id = v_couple_id;
  DELETE FROM chat_messages WHERE couple_id = v_couple_id;
  DELETE FROM activity_ideas WHERE couple_id = v_couple_id;
  DELETE FROM heart_pulses WHERE couple_id = v_couple_id;
  DELETE FROM compliments WHERE couple_id = v_couple_id;
  DELETE FROM important_dates WHERE couple_id = v_couple_id;
  DELETE FROM daily_moods WHERE couple_id = v_couple_id;
  DELETE FROM couple_meetings WHERE couple_id = v_couple_id;
  DELETE FROM tic_tac_toe_games WHERE couple_id = v_couple_id;
  DELETE FROM savings_goals WHERE couple_id = v_couple_id;
  DELETE FROM couple_members WHERE couple_id = v_couple_id;
  DELETE FROM couples WHERE id = v_couple_id;
END;
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tic_tac_toe_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_select_partner" ON public.profiles FOR SELECT
  USING (id = public.partner_user_id());

-- Couples
CREATE POLICY "couples_select_member" ON public.couples FOR SELECT
  USING (public.is_couple_member(id));
CREATE POLICY "couples_insert" ON public.couples FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "couples_update_member" ON public.couples FOR UPDATE
  USING (public.is_couple_member(id));

-- Couple members
CREATE POLICY "members_select_own" ON public.couple_members FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "members_select_partner" ON public.couple_members FOR SELECT
  USING (couple_id = public.my_couple_id() AND user_id != auth.uid());
CREATE POLICY "members_insert_create" ON public.couple_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_couple() = false
    AND (
      role = 'a'
      OR (role = 'b' AND public.couple_has_slot(couple_id))
    )
  );
CREATE POLICY "members_delete_own" ON public.couple_members FOR DELETE
  USING (user_id = auth.uid());

-- Generic couple-scoped policies
CREATE POLICY "meetings_all" ON public.couple_meetings FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "hearts_select" ON public.heart_pulses FOR SELECT
  USING (couple_id = my_couple_id());
CREATE POLICY "hearts_insert" ON public.heart_pulses FOR INSERT
  WITH CHECK (couple_id = my_couple_id() AND sender_id = auth.uid());

CREATE POLICY "ideas_all" ON public.activity_ideas FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT
  USING (couple_id = my_couple_id());
CREATE POLICY "chat_insert" ON public.chat_messages FOR INSERT
  WITH CHECK (couple_id = my_couple_id() AND sender_id = auth.uid());
CREATE POLICY "chat_delete" ON public.chat_messages FOR DELETE
  USING (couple_id = my_couple_id());

CREATE POLICY "album_all" ON public.album_photos FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "ttt_all" ON public.tic_tac_toe_games FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "savings_all" ON public.savings_goals FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "dates_all" ON public.important_dates FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id());

CREATE POLICY "compliments_select" ON public.compliments FOR SELECT
  USING (couple_id = my_couple_id());
CREATE POLICY "compliments_insert" ON public.compliments FOR INSERT
  WITH CHECK (couple_id = my_couple_id() AND sender_id = auth.uid());

CREATE POLICY "moods_all" ON public.daily_moods FOR ALL
  USING (couple_id = my_couple_id()) WITH CHECK (couple_id = my_couple_id() AND user_id = auth.uid());

-- Allow reading couple by id when joining (pending invite)
CREATE POLICY "couples_select_for_join" ON public.couples FOR SELECT
  USING (
    status = 'pending'
    AND public.user_has_couple() = false
    AND public.couple_awaiting_partner(id)
  );

CREATE POLICY "couples_select_pending_empty" ON public.couples FOR SELECT
  USING (
    status = 'pending'
    AND public.user_has_couple() = false
    AND public.couple_is_empty(id)
  );

CREATE POLICY "members_select_for_join" ON public.couple_members FOR SELECT
  USING (
    public.user_has_couple() = false
    AND public.couple_awaiting_partner(couple_id)
  );

-- Storage buckets (run in Dashboard or here)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('album', 'album', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "album_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'album'
    AND (storage.foldername(name))[1] = my_couple_id()::text
  );
CREATE POLICY "album_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'album' AND (storage.foldername(name))[1] = my_couple_id()::text);

-- Realtime publication (Dashboard: Database > Replication)
-- Enable for: heart_pulses, chat_messages, tic_tac_toe_games, savings_goals,
-- couple_meetings, daily_moods, compliments, album_photos, couple_members, couples

-- Cron: delete expired chat (optional — run via pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION public.purge_expired_messages()
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM chat_messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
$$;
