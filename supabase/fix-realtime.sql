-- Realtime для синхронизации между партнёрами
-- Supabase → SQL Editor → Run (можно повторно)

ALTER TABLE public.heart_pulses REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.tic_tac_toe_games REPLICA IDENTITY FULL;
ALTER TABLE public.savings_goals REPLICA IDENTITY FULL;
ALTER TABLE public.couple_meetings REPLICA IDENTITY FULL;
ALTER TABLE public.daily_moods REPLICA IDENTITY FULL;
ALTER TABLE public.compliments REPLICA IDENTITY FULL;
ALTER TABLE public.album_photos REPLICA IDENTITY FULL;
ALTER TABLE public.couple_members REPLICA IDENTITY FULL;
ALTER TABLE public.couples REPLICA IDENTITY FULL;
ALTER TABLE public.activity_ideas REPLICA IDENTITY FULL;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'heart_pulses',
    'chat_messages',
    'tic_tac_toe_games',
    'savings_goals',
    'couple_meetings',
    'daily_moods',
    'compliments',
    'album_photos',
    'couple_members',
    'couples',
    'activity_ideas',
    'battleship_games'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN others THEN
        RAISE NOTICE 'skip %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;
