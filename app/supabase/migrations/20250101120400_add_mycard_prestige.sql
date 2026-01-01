-- Add MyCard Prestige to card catalog
-- This card was missing from the initial seed and is needed for user portfolio testing

insert into public.cards (
  bank,
  name,
  network,
  annual_fee,
  welcome_bonus_points,
  bonus_spend_requirement,
  bonus_spend_currency,
  bonus_spend_window_months,
  points_currency,
  earn_rate_primary,
  earn_rate_secondary,
  min_income,
  notes,
  application_link
)
values (
  'MyCard',
  'Prestige',
  'Mastercard',
  700,
  200000,
  12000,
  'AUD',
  3,
  'Velocity',
  2.0,
  1.0,
  75000,
  '15 Priority Pass lounge visits, 4th Night On Us benefit',
  'https://www.mycard.com.au/credit-cards/prestige-card'
);
