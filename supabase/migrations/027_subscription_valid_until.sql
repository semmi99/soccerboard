-- Access is gated on this hard expiry, not on subscription_status alone --
-- stripe-webhook sets it to (payment date + 30 days) on every successful
-- invoice payment, independent of Stripe's own billing-cycle length. This
-- means a delayed/missed "subscription canceled" webhook can never grant
-- unpaid access beyond what was actually paid for: the tier check always
-- re-verifies against this timestamp rather than trusting a stored flag
-- indefinitely.
alter table public.organizations
  add column subscription_valid_until timestamptz;

create or replace function private.protect_billing_fields()
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
    new.subscription_valid_until = old.subscription_valid_until;
  end if;
  return new;
end;
$$;
