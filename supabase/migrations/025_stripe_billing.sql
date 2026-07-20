-- Stripe billing fields. Populated/kept in sync by the stripe-checkout and
-- stripe-webhook Edge Functions, never written directly by the client.
alter table public.organizations
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text;

create unique index organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;
