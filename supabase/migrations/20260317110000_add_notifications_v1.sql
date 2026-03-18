BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  actor_user_id uuid,
  entity_type text,
  entity_id uuid
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL,
  link text,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'notifications_recipient_user_id_fkey'
         AND conrelid = 'public.notifications'::regclass
     ) THEN
    ALTER TABLE ONLY public.notifications
      ADD CONSTRAINT notifications_recipient_user_id_fkey
      FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'notifications_actor_user_id_fkey'
         AND conrelid = 'public.notifications'::regclass
     ) THEN
    ALTER TABLE ONLY public.notifications
      ADD CONSTRAINT notifications_actor_user_id_fkey
      FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF to_regclass('public.announcements') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'announcements_created_by_fkey'
         AND conrelid = 'public.announcements'::regclass
     ) THEN
    ALTER TABLE ONLY public.announcements
      ADD CONSTRAINT announcements_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.announcements') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'announcements_audience_check'
         AND conrelid = 'public.announcements'::regclass
     ) THEN
    ALTER TABLE ONLY public.announcements
      ADD CONSTRAINT announcements_audience_check
      CHECK (audience IN ('member', 'chapter_head', 'both'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at
  ON public.notifications USING btree (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_is_read
  ON public.notifications USING btree (recipient_user_id, is_read);

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.notifications'::regclass) THEN
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;

  IF to_regclass('public.announcements') IS NOT NULL THEN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.announcements'::regclass) THEN
      ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END
$$;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "announcements_admin_select" ON public.announcements;
CREATE POLICY "announcements_admin_select"
ON public.announcements
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
CREATE POLICY "announcements_admin_insert"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;
CREATE POLICY "announcements_admin_update"
ON public.announcements
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.notification_audience_type(p_audience text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN CASE p_audience
    WHEN 'member' THEN 'announcement_member'
    WHEN 'chapter_head' THEN 'announcement_chapter_head'
    ELSE 'announcement_all'
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_notification(
  p_recipient_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_user_id,
    type,
    title,
    message,
    link,
    actor_user_id,
    entity_type,
    entity_id
  )
  VALUES (
    p_recipient_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_actor_user_id,
    p_entity_type,
    p_entity_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fan_out_announcement_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    recipient_user_id,
    type,
    title,
    message,
    link,
    actor_user_id,
    entity_type,
    entity_id
  )
  SELECT DISTINCT
    recipient.id,
    public.notification_audience_type(NEW.audience),
    NEW.title,
    NEW.message,
    NEW.link,
    NEW.created_by,
    'announcement',
    NEW.id
  FROM (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE NEW.audience IN ('member', 'both')
      AND p.id IS NULL

    UNION

    SELECT p.id
    FROM public.profiles p
    WHERE NEW.audience IN ('chapter_head', 'both')
      AND p.role = 'chapter_head'
  ) AS recipient;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fan_out_announcement_notifications ON public.announcements;
CREATE TRIGGER fan_out_announcement_notifications
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.fan_out_announcement_notifications();

CREATE OR REPLACE FUNCTION public.notify_opportunity_workflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.approval_status = 'pending_approval' THEN
    INSERT INTO public.notifications (
      recipient_user_id,
      type,
      title,
      message,
      link,
      actor_user_id,
      entity_type,
      entity_id
    )
    SELECT
      p.id,
      'opportunity_approval_required',
      'Opportunity approval required',
      format('"%s" is waiting for approval.', NEW.event_name),
      '/admin/opportunities',
      NEW.created_by,
      'volunteer_opportunity',
      NEW.id
    FROM public.profiles p
    WHERE p.role = 'admin';
  END IF;

  IF NEW.approval_status = 'approved'
     AND (TG_OP = 'UPDATE' AND COALESCE(OLD.approval_status, '') <> 'approved') THEN
    IF NEW.created_by IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM public.profiles p
         WHERE p.id = NEW.created_by
           AND p.role = 'chapter_head'
       ) THEN
      PERFORM public.insert_notification(
        NEW.created_by,
        'opportunity_approved',
        'Opportunity approved',
        format('Your opportunity "%s" has been approved.', NEW.event_name),
        '/chapter-head/opportunities',
        auth.uid(),
        'volunteer_opportunity',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_opportunity_workflows ON public.volunteer_opportunities;
CREATE TRIGGER notify_opportunity_workflows
AFTER INSERT OR UPDATE OF approval_status ON public.volunteer_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.notify_opportunity_workflows();

CREATE OR REPLACE FUNCTION public.notify_volunteer_signup_workflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  opp public.volunteer_opportunities%ROWTYPE;
BEGIN
  SELECT *
  INTO opp
  FROM public.volunteer_opportunities
  WHERE id = NEW.opportunity_id;

  IF opp.id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    recipient_user_id,
    type,
    title,
    message,
    link,
    actor_user_id,
    entity_type,
    entity_id
  )
  SELECT
    p.id,
    'new_opportunity_application',
    'New application received',
    format('A new application was received for "%s".', opp.event_name),
    '/chapter-head/volunteers',
    NEW.user_id,
    'volunteer_opportunity',
    opp.id
  FROM public.profiles p
  WHERE p.role = 'chapter_head'
    AND p.chapter_id = opp.chapter_id;

  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.insert_notification(
      NEW.user_id,
      'application_received',
      'Application received',
      format('Your application for "%s" was received.', opp.event_name),
      '/my-account',
      NULL,
      'volunteer_opportunity',
      opp.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_volunteer_signup_workflows ON public.volunteer_signups;
CREATE TRIGGER notify_volunteer_signup_workflows
AFTER INSERT ON public.volunteer_signups
FOR EACH ROW
EXECUTE FUNCTION public.notify_volunteer_signup_workflows();

COMMIT;
