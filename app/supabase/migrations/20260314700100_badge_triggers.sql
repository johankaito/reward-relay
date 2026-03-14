-- Core award function: idempotent, won't error on duplicate
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_type TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_badges (user_id, badge_type)
  VALUES (p_user_id, p_badge_type)
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$;

-- Trigger: first_card when user inserts first user_card
CREATE OR REPLACE FUNCTION check_first_card_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM award_badge(NEW.user_id, 'first_card');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS badge_first_card ON public.user_cards;
CREATE TRIGGER badge_first_card
  AFTER INSERT ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION check_first_card_badge();

-- Trigger: first_cancellation when a card is cancelled
CREATE OR REPLACE FUNCTION check_cancellation_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM award_badge(NEW.user_id, 'first_cancellation');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS badge_cancellation ON public.user_cards;
CREATE TRIGGER badge_cancellation
  AFTER UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION check_cancellation_badge();

-- Trigger: bonus milestones when bonus_earned set to true
CREATE OR REPLACE FUNCTION check_bonus_badges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_points BIGINT;
  v_earned_count INTEGER;
BEGIN
  IF NEW.bonus_earned = TRUE AND OLD.bonus_earned = FALSE THEN
    PERFORM award_badge(NEW.user_id, 'first_bonus_earned');

    SELECT COALESCE(SUM(c.welcome_bonus_points), 0)
    INTO v_total_points
    FROM public.user_cards uc
    JOIN public.cards c ON c.id = uc.card_id
    WHERE uc.user_id = NEW.user_id AND uc.bonus_earned = TRUE;

    IF v_total_points >= 100000 THEN PERFORM award_badge(NEW.user_id, 'hundred_k_club'); END IF;
    IF v_total_points >= 500000 THEN PERFORM award_badge(NEW.user_id, 'five_hundred_k_club'); END IF;

    SELECT COUNT(*) INTO v_earned_count
    FROM public.user_cards WHERE user_id = NEW.user_id AND bonus_earned = TRUE;
    IF v_earned_count >= 5 THEN PERFORM award_badge(NEW.user_id, 'churn_master'); END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS badge_bonus ON public.user_cards;
CREATE TRIGGER badge_bonus
  AFTER UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION check_bonus_badges();

-- Trigger: streak badges on user_profiles update
CREATE OR REPLACE FUNCTION check_streak_badges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.current_streak_days >= 7 THEN PERFORM award_badge(NEW.user_id, 'streak_7'); END IF;
  IF NEW.current_streak_days >= 30 THEN PERFORM award_badge(NEW.user_id, 'streak_30'); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS badge_streak ON public.user_profiles;
CREATE TRIGGER badge_streak
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION check_streak_badges();
