-- Восстановление RLS для фич пары (после fix-rls.sql с CASCADE)
-- Supabase → SQL Editor → Run

-- === couple_meetings ===
DROP POLICY IF EXISTS "meetings_all" ON public.couple_meetings;
CREATE POLICY "meetings_all" ON public.couple_meetings
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === heart_pulses ===
DROP POLICY IF EXISTS "hearts_select" ON public.heart_pulses;
DROP POLICY IF EXISTS "hearts_insert" ON public.heart_pulses;
CREATE POLICY "hearts_select" ON public.heart_pulses
  FOR SELECT USING (public.is_couple_member(couple_id));
CREATE POLICY "hearts_insert" ON public.heart_pulses
  FOR INSERT WITH CHECK (public.is_couple_member(couple_id) AND sender_id = auth.uid());

-- === activity_ideas ===
DROP POLICY IF EXISTS "ideas_all" ON public.activity_ideas;
CREATE POLICY "ideas_all" ON public.activity_ideas
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === chat_messages ===
DROP POLICY IF EXISTS "chat_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_delete" ON public.chat_messages;
CREATE POLICY "chat_select" ON public.chat_messages
  FOR SELECT USING (public.is_couple_member(couple_id));
CREATE POLICY "chat_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (public.is_couple_member(couple_id) AND sender_id = auth.uid());
CREATE POLICY "chat_delete" ON public.chat_messages
  FOR DELETE USING (public.is_couple_member(couple_id));

-- === album_photos ===
DROP POLICY IF EXISTS "album_all" ON public.album_photos;
CREATE POLICY "album_all" ON public.album_photos
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === tic_tac_toe_games ===
DROP POLICY IF EXISTS "ttt_all" ON public.tic_tac_toe_games;
CREATE POLICY "ttt_all" ON public.tic_tac_toe_games
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === savings_goals ===
DROP POLICY IF EXISTS "savings_all" ON public.savings_goals;
CREATE POLICY "savings_all" ON public.savings_goals
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === important_dates ===
DROP POLICY IF EXISTS "dates_all" ON public.important_dates;
CREATE POLICY "dates_all" ON public.important_dates
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

-- === compliments ===
DROP POLICY IF EXISTS "compliments_select" ON public.compliments;
DROP POLICY IF EXISTS "compliments_insert" ON public.compliments;
CREATE POLICY "compliments_select" ON public.compliments
  FOR SELECT USING (public.is_couple_member(couple_id));
CREATE POLICY "compliments_insert" ON public.compliments
  FOR INSERT WITH CHECK (public.is_couple_member(couple_id) AND sender_id = auth.uid());

-- === daily_moods ===
DROP POLICY IF EXISTS "moods_all" ON public.daily_moods;
CREATE POLICY "moods_all" ON public.daily_moods
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id) AND user_id = auth.uid());

-- === battleship_games ===
DROP POLICY IF EXISTS "battleship_all" ON public.battleship_games;
CREATE POLICY "battleship_all" ON public.battleship_games
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));
