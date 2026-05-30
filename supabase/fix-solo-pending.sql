-- FIX v3: оба создали ссылку — можно войти по ссылке партнёра (своя пустая удалится)
-- Supabase → SQL Editor → Run

CREATE OR REPLACE FUNCTION public.user_solo_pending_couple_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.couple_id
  FROM public.couple_members cm
  JOIN public.couples c ON c.id = cm.couple_id
  WHERE cm.user_id = auth.uid()
    AND cm.role = 'a'
    AND c.status = 'pending'
    AND (SELECT COUNT(*)::int FROM public.couple_members WHERE couple_id = cm.couple_id) = 1
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.abandon_solo_pending_couple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
BEGIN
  v_couple_id := public.user_solo_pending_couple_id();
  IF v_couple_id IS NULL THEN
    RETURN;
  END IF;
  DELETE FROM public.couple_members WHERE couple_id = v_couple_id;
  DELETE FROM public.couples WHERE id = v_couple_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_solo_pending_couple_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_solo_pending_couple() TO authenticated;

-- «В паре» = активная пара или уже партнёр (b), НЕ пустая ссылка создателя
CREATE OR REPLACE FUNCTION public.user_has_couple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couple_members cm
    JOIN public.couples c ON c.id = cm.couple_id
    WHERE cm.user_id = auth.uid()
      AND NOT (
        cm.role = 'a'
        AND c.status = 'pending'
        AND (SELECT COUNT(*)::int FROM public.couple_members WHERE couple_id = cm.couple_id) = 1
      )
  );
$$;

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

  -- Своя пустая ссылка не мешает войти к партнёру
  PERFORM public.abandon_solo_pending_couple();

  IF public.user_has_couple() THEN
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

CREATE OR REPLACE FUNCTION public.check_invite_status(p_couple_id uuid)
RETURNS text
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
    RETURN 'not_authenticated';
  END IF;

  SELECT role INTO v_my_role
  FROM public.couple_members
  WHERE couple_id = p_couple_id AND user_id = v_uid;

  IF v_my_role = 'a' THEN RETURN 'creator'; END IF;
  IF v_my_role = 'b' THEN RETURN 'already_member'; END IF;

  IF public.user_has_couple() THEN
    RETURN 'in_other_couple';
  END IF;

  SELECT status INTO v_status FROM public.couples WHERE id = p_couple_id;
  IF v_status IS NULL THEN RETURN 'not_found'; END IF;
  IF v_status <> 'pending' THEN RETURN 'not_pending'; END IF;

  SELECT COUNT(*)::int INTO v_members FROM public.couple_members WHERE couple_id = p_couple_id;
  IF v_members <> 1 THEN RETURN 'full'; END IF;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_couple(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_invite_status(uuid) TO authenticated;
