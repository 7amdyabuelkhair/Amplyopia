-- Grant admin for a user by email (run in Supabase → SQL Editor)
-- Requires: schema.sql, pwa-schema.sql (is_admin column), fix-profiles-rls-recursion.sql

-- Change this email if needed:
-- hamdiabuelkhair@gmail.com  OR  hamdyabuelkhair@gmail.com

do $$
declare
  target_email text := 'hamdiabuelkhair@gmail.com';
  uid uuid;
begin
  select u.id
  into uid
  from auth.users u
  where lower(u.email) = lower(target_email)
  limit 1;

  if uid is null then
    raise exception 'No user in auth.users with email %. Sign up in the app first, then run this again.', target_email;
  end if;

  insert into public.profiles (id, name, gender, birthdate, is_admin, updated_at, created_at)
  values (uid, 'Admin', 'boy', '2010-01-01'::date, true, now(), now())
  on conflict (id) do update
  set
    is_admin = true,
    updated_at = now();

  raise notice 'OK: is_admin = true for % (id: %)', target_email, uid;
end $$;

-- Verify:
select p.id, u.email, p.name, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('hamdiabuelkhair@gmail.com');
