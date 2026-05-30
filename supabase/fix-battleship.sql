-- Морской бой (вместо крестиков-нолик)
-- Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS public.battleship_games (
  couple_id UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.battleship_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "battleship_all" ON public.battleship_games;
CREATE POLICY "battleship_all" ON public.battleship_games
  FOR ALL
  USING (public.is_couple_member(couple_id))
  WITH CHECK (public.is_couple_member(couple_id));

ALTER TABLE public.battleship_games REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battleship_games;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN RAISE NOTICE 'realtime battleship: %', SQLERRM;
END $$;
