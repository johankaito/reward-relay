-- Reward Relay initial schema (cards, user_cards, spending_profiles) with RLS
-- Run this in Supabase SQL editor or via Supabase CLI.

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Cards master catalog (public)
create table if not exists public.cards (
  id uuid primary key default uuid_generate_v4(),
  bank text not null,
  name text not null,
  network text,
  annual_fee numeric,
  welcome_bonus_points integer,
  bonus_spend_requirement numeric,
  bonus_spend_currency text default 'AUD',
  bonus_spend_window_months integer,
  points_currency text,
  earn_rate_primary numeric,
  earn_rate_secondary numeric,
  min_income integer,
  notes text,
  application_link text,
  created_at timestamptz default now()
);

-- User cards (per-user tracked cards)
create table if not exists public.user_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid references public.cards (id),
  bank text,
  name text,
  status text check (status in ('active','cancelled','pending','applied')) default 'active',
  application_date date,
  approval_date date,
  cancellation_date date,
  annual_fee numeric,
  notes text,
  created_at timestamptz default now()
);

-- Spending profiles (optional later use)
create table if not exists public.spending_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  monthly_spend numeric,
  groceries_pct numeric,
  dining_pct numeric,
  travel_pct numeric,
  other_pct numeric,
  created_at timestamptz default now()
);

-- Row Level Security policies are in rls-policies.sql
-- Run that file separately after schema is applied

-- Seed 30 Australian cards (minimal fields). Edit as needed.
insert into public.cards (bank, name, network, annual_fee, welcome_bonus_points, bonus_spend_requirement, bonus_spend_currency, bonus_spend_window_months, points_currency, earn_rate_primary, earn_rate_secondary, min_income, notes, application_link)
values
('American Express','Platinum Charge','Amex',1295,150000,5000,'AUD',3,'MR',2.25,1.0,100000,'$450 travel credit, lounge, insurance','https://www.americanexpress.com/en-au/'),
('American Express','Explorer','Amex',395,100000,3000,'AUD',3,'MR Gateway',2.0,1.0,65000,'$400 travel credit','https://www.americanexpress.com/en-au/'),
('American Express','Qantas Ultimate','Visa',450,120000,4500,'AUD',3,'Qantas',1.25,0.5,75000,'Qantas Club lounge invites','https://www.americanexpress.com/en-au/'),
('ANZ','Frequent Flyer Black','Visa',425,120000,4000,'AUD',3,'Qantas',1.0,0.5,75000,'Travel insurance, lounge pass','https://www.anz.com.au'),
('ANZ','Rewards Black','Visa',375,180000,6000,'AUD',3,'ANZ Rewards',2.0,1.0,75000,'$150 back offer often','https://www.anz.com.au'),
('ANZ','Rewards Platinum','Visa',87,70000,2000,'AUD',3,'ANZ Rewards',1.5,0.75,35000,'Low annual fee first year','https://www.anz.com.au'),
('NAB','Qantas Rewards Signature','Visa',395,120000,4000,'AUD',3,'Qantas',1.0,0.5,75000,'Discounted first-year fee promos','https://www.nab.com.au'),
('NAB','Rewards Signature','Visa',195,90000,3000,'AUD',3,'NAB Rewards',1.25,0.5,50000,'First year fee often waived','https://www.nab.com.au'),
('Westpac','Altitude Black (Qantas)','Mastercard',295,120000,4000,'AUD',3,'Qantas',1.25,0.5,75000,'Includes Amex add-on phased out','https://www.westpac.com.au'),
('Westpac','Altitude Black (Altitude)','Mastercard',295,140000,4000,'AUD',3,'Altitude',1.25,0.5,75000,'Airport lounge passes','https://www.westpac.com.au'),
('Westpac','Altitude Platinum (Qantas)','Mastercard',150,70000,3000,'AUD',3,'Qantas',0.75,0.5,50000,'Two lounge passes','https://www.westpac.com.au'),
('CBA','Ultimate Awards','Mastercard',420,100000,4000,'AUD',3,'CBA Awards',1.5,0.5,75000,'Monthly fee waived with $4k spend','https://www.commbank.com.au'),
('CBA','Smart Awards','Mastercard',120,40000,2000,'AUD',3,'CBA Awards',1.0,0.5,35000,'Low fee option','https://www.commbank.com.au'),
('CBA','Qantas Premium Awards','Mastercard',300,70000,3000,'AUD',3,'Qantas',1.0,0.5,65000,'Qantas transfer option','https://www.commbank.com.au'),
('Macquarie','Platinum Qantas','Visa',99,20000,2000,'AUD',3,'Qantas',1.0,0.5,35000,'Good balance transfer offers','https://www.macquarie.com'),
('Macquarie','Black Qantas','Visa',199,50000,3000,'AUD',3,'Qantas',1.25,0.5,65000,'Travel insurance','https://www.macquarie.com'),
('St.George','Amplify Signature (Qantas)','Visa',279,120000,4000,'AUD',3,'Qantas',1.0,0.5,75000,'Birthday bonus points','https://www.stgeorge.com.au'),
('St.George','Amplify Signature (Amplify)','Visa',279,150000,4000,'AUD',3,'Amplify',1.5,0.5,75000,'Travel insurance','https://www.stgeorge.com.au'),
('St.George','Amplify Platinum (Qantas)','Visa',99,60000,2000,'AUD',3,'Qantas',0.75,0.5,35000,'Low annual fee','https://www.stgeorge.com.au'),
('BOQ','Blue','Visa',49,20000,1000,'AUD',3,'Q Rewards',1.0,0.5,30000,'Entry-level churning option','https://www.boq.com.au'),
('HSBC','Platinum Qantas','Visa',199,80000,4000,'AUD',3,'Qantas',1.0,0.5,65000,'Lounge passes','https://www.hsbc.com.au'),
('HSBC','Rewards Plus','Visa',129,50000,3000,'AUD',3,'HSBC Rewards',1.5,0.5,50000,'No international fees promo','https://www.hsbc.com.au'),
('Virgin Money','Velocity High Flyer','Visa',289,80000,3000,'AUD',3,'Velocity',1.25,0.5,65000,'$129 travel credit','https://www.virginmoney.com.au'),
('Virgin Money','Velocity Flyer','Visa',129,60000,1500,'AUD',3,'Velocity',0.66,0.5,45000,'Often discounted first-year fee','https://www.virginmoney.com.au'),
('Bankwest','More World Mastercard','Mastercard',270,100000,3000,'AUD',3,'Bankwest More',2.0,1.0,65000,'Worldwide lounge with DragonPass','https://www.bankwest.com.au'),
('Bankwest','More Platinum Mastercard','Mastercard',160,60000,3000,'AUD',3,'Bankwest More',1.0,0.5,50000,'No foreign fees','https://www.bankwest.com.au'),
('Bendigo Bank','Qantas Platinum','Mastercard',149,50000,2500,'AUD',3,'Qantas',0.6,0.5,50000,'Regional-friendly issuer','https://www.bendigobank.com.au'),
('Latitude','28° Global Platinum','Mastercard',0,null,null,null,null,'Latitude',0.0,0.0,0,'Great for overseas spend; no bonus','https://www.latitudefinancial.com.au'),
('Citi','Rewards Signature','Mastercard',395,150000,4000,'AUD',3,'Citi Rewards',1.5,0.5,75000,'Annual fee often rebated','https://www.citibank.com.au'),
('Citi','Qantas Premier Platinum','Mastercard',349,100000,3500,'AUD',3,'Qantas',1.0,0.5,65000,'Discount first-year fee','https://www.citibank.com.au');
