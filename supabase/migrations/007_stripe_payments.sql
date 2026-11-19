-- Real payments through Stripe Checkout.

-- The same Stripe Checkout session can only ever be recorded once. Stripe can send its webhook
-- more than once, and the success page fulfills the purchase too, so this is the safety net
create unique index list_payments_provider_ref_key
  on public.list_payments (provider, provider_ref)
  where provider_ref is not null;

-- Set when a payment is refunded or disputed. The list (or promotion) it paid for is pulled
alter table public.list_payments add column refunded_at timestamptz;

-- Promotions are no longer always 30 days (now 14), so new ones are recorded as 'promote'.
-- Old 'promote_30' rows from the fake checkout stay valid
alter table public.list_payments drop constraint list_payments_kind_check;
alter table public.list_payments
  add constraint list_payments_kind_check
  check (kind in ('first_list', 'extra_list', 'promote', 'promote_30'));
