-- Function: check if a user_card has met minimum spend within the window
CREATE OR REPLACE FUNCTION check_bonus_eligibility(p_user_card_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_spend NUMERIC;
  v_requirement NUMERIC;
  v_deadline DATE;
  v_bonus_earned BOOLEAN;
BEGIN
  SELECT
    uc.current_spend,
    uc.bonus_spend_deadline,
    uc.bonus_earned,
    c.bonus_spend_requirement
  INTO v_current_spend, v_deadline, v_bonus_earned, v_requirement
  FROM public.user_cards uc
  LEFT JOIN public.cards c ON c.id = uc.card_id
  WHERE uc.id = p_user_card_id;

  -- Already earned, deadline passed, or no requirement set
  IF v_bonus_earned = TRUE THEN RETURN FALSE; END IF;
  IF v_deadline IS NULL OR v_deadline < CURRENT_DATE THEN RETURN FALSE; END IF;
  IF v_requirement IS NULL OR v_requirement = 0 THEN RETURN FALSE; END IF;

  RETURN v_current_spend >= v_requirement;
END;
$$ SECURITY DEFINER;

-- Trigger: fire after current_spend updates on user_cards
CREATE OR REPLACE FUNCTION suggest_bonus_earned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_spend <> OLD.current_spend
    AND NEW.bonus_earned = FALSE
    AND check_bonus_eligibility(NEW.id) = TRUE
  THEN
    NEW.bonus_earned_suggested := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS suggest_bonus_earned_trigger ON public.user_cards;
CREATE TRIGGER suggest_bonus_earned_trigger
BEFORE UPDATE ON public.user_cards
FOR EACH ROW
EXECUTE FUNCTION suggest_bonus_earned();
