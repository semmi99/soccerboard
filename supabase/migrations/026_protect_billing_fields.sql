-- organizations_all_platform_admin/org_update_own let any org member update
-- their own org row with no column-level restriction — harmless while
-- subscription_tier was purely informational, but a real gap now that
-- Stripe billing fields live on the same row: an authenticated member could
-- otherwise PATCH their own subscription_tier to 'pro' directly via the
-- REST API, bypassing payment entirely. These columns may only ever be
-- written by a service-role client (the stripe-webhook/stripe-checkout Edge
-- Functions), never through the regular authenticated client — including
-- platform admins, who still get free_override (untouched here) instead.
create function private.protect_billing_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.subscription_tier = old.subscription_tier;
    new.stripe_customer_id = old.stripe_customer_id;
    new.stripe_subscription_id = old.stripe_subscription_id;
    new.subscription_status = old.subscription_status;
  end if;
  return new;
end;
$$;

create trigger organizations_protect_billing_fields
before update on public.organizations
for each row execute function private.protect_billing_fields();
