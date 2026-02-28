/*
  Security and performance hardening:
  1) Add missing enum values used by app logic
  2) Move credential verification into Postgres functions (no password hash in client responses)
  3) Provide single-query admin dashboard metrics RPC
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TYPE block_reason_type ADD VALUE IF NOT EXISTS 'PLACED_FULL_TIME';
ALTER TYPE block_reason_type ADD VALUE IF NOT EXISTS 'PLACED_PPO';
ALTER TYPE block_reason_type ADD VALUE IF NOT EXISTS 'PLACED_INTERNSHIP';

CREATE OR REPLACE FUNCTION public.login_student_secure(
  prn_input text,
  password_input text,
  device_input text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  user_data jsonb,
  session_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_row students%ROWTYPE;
  expected_hash text;
  new_session_id text;
BEGIN
  SELECT * INTO student_row
  FROM students
  WHERE prn = upper(trim(prn_input))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid PRN or password', NULL::jsonb, NULL::text;
    RETURN;
  END IF;

  IF student_row.password_hash LIKE 'sha256:%' THEN
    expected_hash := 'sha256:' || encode(digest(password_input, 'sha256'), 'hex');
  ELSE
    expected_hash := password_input;
  END IF;

  IF expected_hash <> student_row.password_hash THEN
    RETURN QUERY SELECT false, 'Invalid PRN or password', NULL::jsonb, NULL::text;
    RETURN;
  END IF;

  IF NOT student_row.is_approved THEN
    RETURN QUERY SELECT false, 'Your account is pending admin approval. Please wait for approval or contact TPO office.', NULL::jsonb, NULL::text;
    RETURN;
  END IF;

  IF student_row.is_blocked THEN
    RETURN QUERY
      SELECT false,
        'Your account has been blocked. Reason: '
        || coalesce(replace(student_row.block_reason::text, '_', ' '), 'UNKNOWN')
        || coalesce(' - ' || NULLIF(student_row.block_remark, ''), ''),
        NULL::jsonb,
        NULL::text;
    RETURN;
  END IF;

  new_session_id := gen_random_uuid()::text;

  UPDATE students
  SET
    active_session_id = new_session_id,
    last_login = now(),
    last_login_device = device_input,
    updated_at = now()
  WHERE id = student_row.id;

  student_row.active_session_id := new_session_id;
  student_row.last_login := now();
  student_row.last_login_device := device_input;

  RETURN QUERY SELECT true, NULL::text, to_jsonb(student_row) - 'password_hash', new_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_admin_secure(
  email_input text,
  password_input text
)
RETURNS TABLE (
  success boolean,
  message text,
  user_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_row admin_users%ROWTYPE;
  expected_hash text;
BEGIN
  SELECT * INTO admin_row
  FROM admin_users
  WHERE email = lower(trim(email_input))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid email or password', NULL::jsonb;
    RETURN;
  END IF;

  IF admin_row.password_hash LIKE 'sha256:%' THEN
    expected_hash := 'sha256:' || encode(digest(password_input, 'sha256'), 'hex');
  ELSE
    expected_hash := password_input;
  END IF;

  IF expected_hash <> admin_row.password_hash THEN
    RETURN QUERY SELECT false, 'Invalid email or password', NULL::jsonb;
    RETURN;
  END IF;

  IF NOT admin_row.is_active THEN
    RETURN QUERY SELECT false, 'Your account is deactivated. Please contact administrator.', NULL::jsonb;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text, to_jsonb(admin_row) - 'password_hash';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS TABLE (
  total_students bigint,
  approved_students bigint,
  blocked_students bigint,
  pending_requests bigint,
  placed_students bigint,
  internships bigint,
  ppo_count bigint,
  full_time_count bigint,
  total_companies bigint,
  active_jobs bigint,
  total_applications bigint,
  batch_stats jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH student_counts AS (
    SELECT
      count(*) AS total_students,
      count(*) FILTER (WHERE is_approved) AS approved_students,
      count(*) FILTER (WHERE is_blocked) AS blocked_students,
      count(*) FILTER (WHERE NOT is_approved AND NOT is_blocked) AS pending_requests,
      count(*) FILTER (WHERE placement_status <> 'NOT_PLACED') AS placed_students,
      count(*) FILTER (WHERE placement_status = 'INTERNSHIP') AS internships,
      count(*) FILTER (WHERE placement_status = 'PPO') AS ppo_count,
      count(*) FILTER (WHERE placement_status = 'FULL_TIME') AS full_time_count
    FROM students
  ),
  batch_counts AS (
    SELECT jsonb_agg(jsonb_build_object('batch', batch_year, 'count', count_val) ORDER BY batch_year DESC) AS stats
    FROM (
      SELECT batch_year, count(*) AS count_val
      FROM students
      GROUP BY batch_year
    ) b
  )
  SELECT
    sc.total_students,
    sc.approved_students,
    sc.blocked_students,
    sc.pending_requests,
    sc.placed_students,
    sc.internships,
    sc.ppo_count,
    sc.full_time_count,
    (SELECT count(*) FROM companies) AS total_companies,
    (SELECT count(*) FROM job_drives WHERE is_active) AS active_jobs,
    (SELECT count(*) FROM applications) AS total_applications,
    coalesce(bc.stats, '[]'::jsonb) AS batch_stats
  FROM student_counts sc
  CROSS JOIN batch_counts bc;
$$;

GRANT EXECUTE ON FUNCTION public.login_student_secure(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_admin_secure(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO anon, authenticated;
