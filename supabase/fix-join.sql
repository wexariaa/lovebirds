-- FIX: партнёр не может присоединиться (RLS couple_members)
-- Supabase → SQL Editor → Run

CREATE OR REPLACE FUNCTION public.join_couple(p_couple_id uuid, p_together_since date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
  v_members int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'You are already in a couple';
  END IF;

  SELECT status INTO v_status FROM public.couples WHERE id = p_couple_id;
  IF v_status IS NULL OR v_status <> 'pending' THEN
    RAISE EXCEPTION 'Invite link is invalid or expired';
  END IF;

  SELECT COUNT(*)::int INTO v_members FROM public.couple_members WHERE couple_id = p_couple_id;
  IF v_members <> 1 THEN
    RAISE EXCEPTION 'This pair is already full';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (p_couple_id, v_uid, 'b');

  UPDATE public.couples
  SET status = 'active', together_since = p_together_since
  WHERE id = p_couple_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_couple(uuid, date) TO authenticated;

-- На всякий случай: разрешить insert для role b если RPC не используется
DROP POLICY IF EXISTS "members_insert_join" ON public.couple_members;
CREATE POLICY "members_insert_join" ON public.couple_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = 'b'
    AND public.user_has_couple() = false
    AND public.couple_awaiting_partner(couple_id)
  );

-- Создатель (role a) — отдельная политика
DROP POLICY IF EXISTS "members_insert_create" ON public.couple_members;
CREATE POLICY "members_insert_create" ON public.couple_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = 'a'
    AND public.user_has_couple() = false
  );

-- Партнёр может обновить пару сразу после join (до refresh сессии)
DROP POLICY IF EXISTS "couples_update_on_join" ON public.couples;
CREATE POLICY "couples_update_on_join" ON public.couples
  FOR UPDATE USING (
    public.is_couple_member(id)
    OR (
      status = 'pending'
      AND public.couple_awaiting_partner(id)
      AND public.user_has_couple() = false
    )
  );
