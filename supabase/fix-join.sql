-- FIX v2: idempotent join + понятные ошибки
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
  v_my_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Уже в ЭТОЙ паре (повторное нажатие / медленный интернет)
  SELECT role INTO v_my_role
  FROM public.couple_members
  WHERE couple_id = p_couple_id AND user_id = v_uid;

  IF v_my_role IS NOT NULL THEN
    IF v_my_role = 'a' THEN
      RAISE EXCEPTION 'This is your invite link — send it to your partner';
    END IF;
    UPDATE public.couples
    SET status = 'active', together_since = p_together_since
    WHERE id = p_couple_id;
    RETURN;
  END IF;

  -- В другой паре
  IF EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'You are already in a different couple';
  END IF;

  SELECT status INTO v_status FROM public.couples WHERE id = p_couple_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Invite link not found';
  END IF;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Invite link is no longer pending';
  END IF;

  SELECT COUNT(*)::int INTO v_members FROM public.couple_members WHERE couple_id = p_couple_id;
  IF v_members <> 1 THEN
    RAISE EXCEPTION 'This pair is already full or not ready';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id, role)
  VALUES (p_couple_id, v_uid, 'b');

  UPDATE public.couples
  SET status = 'active', together_since = p_together_since
  WHERE id = p_couple_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_couple(uuid, date) TO authenticated;
