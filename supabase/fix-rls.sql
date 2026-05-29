-- FIX v4 — "new row violates row-level security policy for table couples"
-- Supabase → SQL Editor → вставить ВЕСЬ файл → Run

DROP FUNCTION IF EXISTS public.my_couple_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_couple_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.couple_has_slot(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_couple() CASCADE;
DROP FUNCTION IF EXISTS public.partner_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.couple_awaiting_partner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.couple_is_empty(uuid) CASCADE;

CREATE FUNCTION public.my_couple_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE FUNCTION public.is_couple_member(p_couple_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = p_couple_id AND user_id = auth.uid()
  );
$$;

CREATE FUNCTION public.couple_has_slot(p_couple_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) < 2 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

CREATE FUNCTION public.user_has_couple()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.couple_members WHERE user_id = auth.uid());
$$;

CREATE FUNCTION public.partner_user_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT cm2.user_id
  FROM public.couple_members cm1
  JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
  WHERE cm1.user_id = auth.uid() AND cm2.user_id <> auth.uid()
  LIMIT 1;
$$;

CREATE FUNCTION public.couple_awaiting_partner(p_couple_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) = 1 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

CREATE FUNCTION public.couple_is_empty(p_couple_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) = 0 FROM public.couple_members WHERE couple_id = p_couple_id;
$$;

GRANT EXECUTE ON FUNCTION public.my_couple_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_couple_member(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.couple_has_slot(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_has_couple() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.partner_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.couple_awaiting_partner(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.couple_is_empty(uuid) TO authenticated, anon;

-- === couples ===
DROP POLICY IF EXISTS "couples_insert" ON public.couples;
DROP POLICY IF EXISTS "couples_select_member" ON public.couples;
DROP POLICY IF EXISTS "couples_update_member" ON public.couples;
DROP POLICY IF EXISTS "couples_select_for_join" ON public.couples;
DROP POLICY IF EXISTS "couples_select_pending_empty" ON public.couples;

CREATE POLICY "couples_insert" ON public.couples
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "couples_select_member" ON public.couples
  FOR SELECT USING (public.is_couple_member(id));

CREATE POLICY "couples_update_member" ON public.couples
  FOR UPDATE USING (public.is_couple_member(id));

CREATE POLICY "couples_select_for_join" ON public.couples
  FOR SELECT USING (
    status = 'pending'
    AND public.user_has_couple() = false
    AND public.couple_awaiting_partner(id)
  );

CREATE POLICY "couples_select_pending_empty" ON public.couples
  FOR SELECT USING (
    status = 'pending'
    AND public.user_has_couple() = false
    AND public.couple_is_empty(id)
  );

-- === couple_members ===
DROP POLICY IF EXISTS "members_select_same_couple" ON public.couple_members;
DROP POLICY IF EXISTS "members_select_own" ON public.couple_members;
DROP POLICY IF EXISTS "members_select_partner" ON public.couple_members;
DROP POLICY IF EXISTS "members_select_for_join" ON public.couple_members;
DROP POLICY IF EXISTS "members_insert_create" ON public.couple_members;

CREATE POLICY "members_select_own" ON public.couple_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "members_select_partner" ON public.couple_members
  FOR SELECT USING (couple_id = public.my_couple_id() AND user_id <> auth.uid());

CREATE POLICY "members_select_for_join" ON public.couple_members
  FOR SELECT USING (
    public.user_has_couple() = false
    AND public.couple_awaiting_partner(couple_id)
  );

CREATE POLICY "members_insert_create" ON public.couple_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.user_has_couple() = false
    AND (role = 'a' OR (role = 'b' AND public.couple_has_slot(couple_id)))
  );

-- === profiles ===
DROP POLICY IF EXISTS "profiles_select_partner" ON public.profiles;
CREATE POLICY "profiles_select_partner" ON public.profiles
  FOR SELECT USING (id = public.partner_user_id());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
