# frozen_string_literal: true

class ProtectPayrollPtoHistory < ActiveRecord::Migration[8.1]
  TABLES = %w[consultant_pto_policies payroll_pto_entries payroll_pto_allocations payroll_pto_recoveries].freeze

  def up
    safety_assured do
      # These tables were created by the preceding migration and have no pre-release writers.
      add_index :payroll_pto_entries, :origin_entry_id, unique: true, where: "origin_entry_id IS NOT NULL AND previous_entry_id IS NULL",
        name: "pto_obligation_one_review_root", if_not_exists: true
      execute <<~SQL
        CREATE OR REPLACE FUNCTION protect_payroll_pto_history() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'Payroll PTO history is immutable';
        END; $$;
        CREATE OR REPLACE FUNCTION validate_payroll_pto_policy() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE first_policy consultant_pto_policies;
        BEGIN
          PERFORM id FROM employments WHERE id = NEW.employment_id FOR UPDATE;
          SELECT * INTO first_policy FROM consultant_pto_policies WHERE employment_id = NEW.employment_id ORDER BY id LIMIT 1;
          IF first_policy.id IS NOT NULL AND (NEW.opening_on <> first_policy.opening_on OR NEW.opening_minutes <> first_policy.opening_minutes) THEN
            RAISE EXCEPTION 'Reconciled PTO opening cannot be reset';
          END IF;
          IF EXISTS (SELECT 1 FROM payroll_pto_entries WHERE employment_id = NEW.employment_id AND kind = 'accrual' AND period >= NEW.effective_on) THEN
            RAISE EXCEPTION 'Earned PTO accrual policy cannot be replaced retroactively';
          END IF;
          RETURN NEW;
        END; $$;
        CREATE OR REPLACE FUNCTION validate_payroll_pto_entry() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE origin payroll_pto_entries; approved_policy consultant_pto_policies; part jsonb; total numeric := 0; paid numeric := 0; advance numeric := 0;
          original numeric; allocated numeric; resolved numeric; available numeric; part_minutes numeric; component_count integer;
        BEGIN
          PERFORM id FROM employments WHERE id = NEW.employment_id FOR UPDATE;
          IF NEW.minutes::text IN ('NaN','Infinity','-Infinity') OR NEW.debt_minutes::text IN ('NaN','Infinity','-Infinity') OR
            NEW.balance_delta_minutes::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'PTO quantities must be finite'; END IF;
          IF NEW.kind = 'accrual' THEN
            SELECT * INTO approved_policy FROM consultant_pto_policies WHERE employment_id = NEW.employment_id AND effective_on <= NEW.period
              ORDER BY effective_on DESC, id DESC LIMIT 1;
            IF approved_policy.id IS NULL OR NEW.consultant_pto_policy_id <> approved_policy.id OR NEW.minutes <> approved_policy.monthly_accrual_minutes OR
              NEW.period + approved_policy.accrual_day - 1 <= approved_policy.opening_on OR NOT EXISTS
                (SELECT 1 FROM employments e WHERE e.id = NEW.employment_id AND e.joined_at IS NOT NULL
                  AND NEW.period + approved_policy.accrual_day - 1 >= e.joined_at
                  AND (e.resigned_at IS NULL OR NEW.period + approved_policy.accrual_day - 1 <= e.resigned_at)) THEN
              RAISE EXCEPTION 'PTO accrual must use its latest applicable earned policy';
            END IF;
          END IF;
          IF NEW.previous_entry_id IS NOT NULL AND NOT EXISTS
            (SELECT 1 FROM payroll_pto_entries p WHERE p.id = NEW.previous_entry_id AND p.case_key = NEW.case_key
              AND p.employment_id = NEW.employment_id AND p.period <= NEW.period
              AND p.origin_entry_id IS NOT DISTINCT FROM NEW.origin_entry_id AND p.origin_component IS NOT DISTINCT FROM NEW.origin_component) THEN
            RAISE EXCEPTION 'PTO decision must extend its own case history';
          END IF;
          IF NEW.previous_entry_id IS NOT NULL AND EXISTS (SELECT 1 FROM payroll_pto_entries previous
            WHERE previous.id = NEW.previous_entry_id AND previous.balance_delta_minutes <> 0 AND previous.period <> NEW.period) THEN
            RAISE EXCEPTION 'A historical PTO balance decision must retain its original period';
          END IF;
          IF NEW.previous_entry_id IS NOT NULL AND
            (EXISTS (SELECT 1 FROM payroll_pto_allocations WHERE origin_entry_id = NEW.previous_entry_id) OR
              EXISTS (SELECT 1 FROM payroll_pto_recoveries recovery WHERE recovery.payroll_pto_entry_id = NEW.previous_entry_id
                AND recovery.kind <> 'released' AND NOT EXISTS
                  (SELECT 1 FROM payroll_pto_recoveries child WHERE child.previous_recovery_id = recovery.id)) OR
              EXISTS (SELECT 1 FROM payroll_pto_entries e WHERE e.origin_entry_id = NEW.previous_entry_id
                AND e.kind IN ('review_unpaid','review_waive','review_advance') AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = e.id))) THEN
            RAISE EXCEPTION 'PTO recovery uses this source; review its remaining obligation first';
          END IF;
          IF NEW.previous_entry_id IS NOT NULL AND EXISTS (SELECT 1 FROM payroll_pto_entries previous
            WHERE previous.id = NEW.previous_entry_id AND NEW.balance_delta_minutes < previous.balance_delta_minutes
              AND previous.kind IN ('review_unpaid','review_waive') AND EXISTS
                (SELECT 1 FROM payroll_pto_entries earned WHERE earned.employment_id = NEW.employment_id AND earned.kind = 'accrual'
                  AND earned.period >= previous.period AND earned.id > previous.id)) THEN
            RAISE EXCEPTION 'Earned PTO accrual prevents reopening this historical balance';
          END IF;
          SELECT COALESCE((SELECT balance_delta_minutes FROM payroll_pto_entries WHERE id = NEW.previous_entry_id),0) INTO original;
          IF NEW.balance_delta_minutes < original AND EXISTS (SELECT 1 FROM payroll_pto_entries later
            WHERE later.employment_id = NEW.employment_id AND later.period > NEW.period AND later.balance_delta_minutes < 0
              AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = later.id)) THEN
            RAISE EXCEPTION 'A later approved PTO decision consumes this balance';
          END IF;
          IF NEW.kind IN ('paid','advance','unpaid','defer','waive','correction','allocation') THEN
            FOR part IN SELECT value FROM jsonb_array_elements(CASE WHEN NEW.kind = 'correction' AND NEW.minutes = 0 AND NEW.previous_entry_id IS NOT NULL AND NEW.allocations = '[]'::jsonb THEN '[]'::jsonb
              WHEN NEW.allocations = '[]'::jsonb AND NEW.kind <> 'allocation'
              THEN jsonb_build_array(jsonb_build_object('kind',NEW.kind,'minutes',NEW.minutes::text)) ELSE NEW.allocations END) LOOP
              SELECT count(*) INTO component_count FROM jsonb_object_keys(part);
              IF component_count <> 2 OR NOT (part ? 'kind') OR NOT (part ? 'minutes') OR jsonb_typeof(part->'kind') <> 'string' OR
                part->>'kind' NOT IN ('paid','advance','unpaid','defer','waive','correction') OR
                jsonb_typeof(part->'minutes') <> 'string' OR (part->>'minutes') !~ '^[0-9]+([.][0-9]+)?$' THEN
                RAISE EXCEPTION 'Invalid typed PTO allocation';
              END IF;
              part_minutes := (part->>'minutes')::numeric;
              IF part_minutes <= 0 THEN RAISE EXCEPTION 'PTO allocations must be positive'; END IF;
              total := total + part_minutes;
              IF part->>'kind' = 'paid' THEN paid := paid + part_minutes; END IF;
              IF part->>'kind' = 'advance' THEN advance := advance + part_minutes; END IF;
            END LOOP;
            IF total <> NEW.minutes OR NEW.balance_delta_minutes <> -paid - advance OR
              (SELECT count(*) <> count(DISTINCT value->>'kind') FROM jsonb_array_elements(NEW.allocations)) THEN
              RAISE EXCEPTION 'PTO allocations must match the complete approved quantity';
            END IF;
            SELECT p.opening_minutes INTO available FROM consultant_pto_policies p WHERE p.id = NEW.consultant_pto_policy_id;
            SELECT available + COALESCE(SUM(e.balance_delta_minutes),0) INTO available FROM payroll_pto_entries e
              WHERE e.employment_id = NEW.employment_id AND e.period < NEW.period + INTERVAL '1 month'
                AND e.id IS DISTINCT FROM NEW.previous_entry_id
                AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = e.id AND child.period < NEW.period + INTERVAL '1 month');
            IF paid > GREATEST(available,0) OR NEW.debt_minutes <> LEAST(advance,GREATEST(advance-GREATEST(available-paid,0),0)) THEN
              RAISE EXCEPTION 'PTO paid balance or incremental advance is invalid';
            END IF;
          END IF;
          IF NEW.kind = 'opening' AND NOT EXISTS (SELECT 1 FROM consultant_pto_policies p WHERE p.id = NEW.consultant_pto_policy_id
            AND p.opening_minutes < 0 AND NEW.minutes = -p.opening_minutes AND NEW.debt_minutes = NEW.minutes
            AND NEW.period = p.opening_on AND NEW.case_key = 'opening:' || p.opening_on::text) THEN
            RAISE EXCEPTION 'PTO opening must reference its single reconciled source';
          END IF;
          IF NEW.origin_entry_id IS NOT NULL THEN
            SELECT * INTO origin FROM payroll_pto_entries WHERE id = NEW.origin_entry_id;
            IF EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = origin.id) THEN
              RAISE EXCEPTION 'PTO recovery origin is no longer current';
            END IF;
            IF NEW.origin_component IN ('opening','advance') THEN
              original := origin.debt_minutes;
              SELECT COALESCE(SUM(minutes),0) INTO allocated FROM payroll_pto_allocations WHERE origin_entry_id = origin.id;
            ELSE
              SELECT COALESCE(SUM((value->>'minutes')::numeric),0) INTO original FROM jsonb_array_elements(origin.allocations)
                WHERE value->>'kind' = NEW.origin_component;
              IF origin.allocations = '[]'::jsonb AND origin.kind = NEW.origin_component THEN original := origin.minutes; END IF;
              allocated := 0;
            END IF;
            SELECT COALESCE(SUM(e.minutes),0) INTO resolved FROM payroll_pto_entries e WHERE e.origin_entry_id = origin.id
              AND e.origin_component = NEW.origin_component AND e.kind IN ('review_unpaid','review_waive','review_advance')
              AND e.id IS DISTINCT FROM NEW.previous_entry_id AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = e.id);
            IF NEW.minutes > original - allocated - resolved OR original <= 0 THEN
              RAISE EXCEPTION 'PTO obligation exceeds its remaining unrecovered quantity';
            END IF;
            IF NEW.kind = 'review_unpaid' THEN
              IF jsonb_typeof(NEW.rate_basis->'amount') IS DISTINCT FROM 'string' OR jsonb_typeof(NEW.rate_basis->'hours') IS DISTINCT FROM 'string' OR
                (NEW.rate_basis->>'amount') !~ '^[0-9]+([.][0-9]{1,2})?$' OR (NEW.rate_basis->>'hours') !~ '^[0-9]+([.][0-9]{1,2})?$' OR
                COALESCE(length(btrim(NEW.rate_basis->>'reference')),0) NOT BETWEEN 1 AND 200 THEN
                RAISE EXCEPTION 'PTO recovery requires its explicit approved historical rate';
              END IF;
              IF (NEW.rate_basis->>'amount')::numeric <= 0 OR (NEW.rate_basis->>'hours')::numeric <= 0 OR
                NEW.cash_amount_minor <> ROUND((NEW.rate_basis->>'amount')::numeric * NEW.minutes / ((NEW.rate_basis->>'hours')::numeric * 60) * 100,0) THEN
                RAISE EXCEPTION 'PTO recovery amount must match its approved exact historical basis';
              END IF;
              IF origin.rate_basis ? 'origin_amount' AND
                ((NEW.rate_basis->>'amount')::numeric <> (origin.rate_basis->>'origin_amount')::numeric OR
                  (NEW.rate_basis->>'hours')::numeric <> (origin.rate_basis->>'origin_hours')::numeric) THEN
                RAISE EXCEPTION 'PTO recovery must use its immutable origin basis';
              END IF;
            END IF;
            IF NEW.kind = 'review_advance' THEN
              SELECT p.opening_minutes INTO available FROM consultant_pto_policies p WHERE p.id = NEW.consultant_pto_policy_id;
              SELECT available + COALESCE(SUM(e.balance_delta_minutes),0) INTO available FROM payroll_pto_entries e
                WHERE e.employment_id = NEW.employment_id AND e.period < NEW.period + INTERVAL '1 month'
                  AND e.id IS DISTINCT FROM NEW.previous_entry_id
                  AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = e.id AND child.period < NEW.period + INTERVAL '1 month');
              IF NEW.debt_minutes <> LEAST(NEW.minutes,GREATEST(NEW.minutes-GREATEST(available,0),0)) THEN
                RAISE EXCEPTION 'Historical PTO advance must record only incremental borrowing';
              END IF;
            END IF;
          END IF;
          RETURN NEW;
        END; $$;
        CREATE OR REPLACE FUNCTION validate_payroll_pto_recovery() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE previous payroll_pto_recoveries;
        BEGIN
          PERFORM id FROM employments WHERE id = NEW.employment_id FOR UPDATE;
          IF NOT EXISTS (SELECT 1 FROM payroll_runs r JOIN payroll_revisions v ON v.payroll_run_id = r.id
            WHERE r.id = NEW.payroll_run_id AND r.company_id = NEW.company_id AND v.id = NEW.payroll_revision_id) THEN
            RAISE EXCEPTION 'PTO recovery run and revision must belong to its workspace';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM payroll_pto_entries e WHERE e.id = NEW.payroll_pto_entry_id AND (e.kind IN ('unpaid','review_unpaid')
            OR (e.kind = 'allocation' AND EXISTS (SELECT 1 FROM jsonb_array_elements(e.allocations) p WHERE p->>'kind' = 'unpaid')))) THEN
            RAISE EXCEPTION 'PTO recovery requires an approved unpaid decision';
          END IF;
          IF NEW.previous_recovery_id IS NULL THEN
            IF NEW.kind <> 'reserved' THEN RAISE EXCEPTION 'Invalid PTO recovery transition'; END IF;
          ELSE
            SELECT * INTO previous FROM payroll_pto_recoveries WHERE id = NEW.previous_recovery_id;
            IF previous.payroll_pto_entry_id <> NEW.payroll_pto_entry_id OR previous.amount_minor <> NEW.amount_minor OR NOT
              ((previous.kind = 'reserved' AND NEW.kind IN ('released','settled') AND previous.payroll_run_id = NEW.payroll_run_id AND previous.payroll_revision_id = NEW.payroll_revision_id)
                OR (previous.kind = 'released' AND NEW.kind = 'reserved')
                OR (previous.kind = 'settled' AND NEW.kind = 'returned_review' AND previous.payroll_run_id = NEW.payroll_run_id)
                OR (previous.kind = 'returned_review' AND NEW.kind = 'settled' AND previous.payroll_run_id = NEW.payroll_run_id
                  AND previous.payroll_revision_id = NEW.payroll_revision_id AND NEW.actor_id IS NOT NULL AND length(btrim(NEW.reason)) > 0
                  AND EXISTS (SELECT 1 FROM payroll_runs r WHERE r.id = NEW.payroll_run_id AND r.final_reviewer_id = NEW.actor_id))) THEN
              RAISE EXCEPTION 'Invalid PTO recovery transition';
            END IF;
          END IF;
          RETURN NEW;
        END; $$;
        CREATE OR REPLACE FUNCTION validate_payroll_pto_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE available numeric; debt numeric; allocated numeric; resolved numeric;
        BEGIN
          PERFORM id FROM employments WHERE id = NEW.employment_id FOR UPDATE;
          IF NEW.minutes::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'PTO quantities must be finite'; END IF;
          SELECT minutes INTO available FROM payroll_pto_entries WHERE id = NEW.accrual_entry_id AND kind = 'accrual';
          SELECT debt_minutes INTO debt FROM payroll_pto_entries WHERE id = NEW.origin_entry_id AND debt_minutes > 0;
          IF EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = NEW.origin_entry_id) THEN
            RAISE EXCEPTION 'PTO accrual recovery origin is no longer current';
          END IF;
          SELECT COALESCE(SUM(minutes), 0) INTO allocated FROM payroll_pto_allocations WHERE accrual_entry_id = NEW.accrual_entry_id;
          IF available IS NULL OR debt IS NULL OR allocated + NEW.minutes > available THEN
            RAISE EXCEPTION 'PTO accrual allocation exceeds its approved source';
          END IF;
          SELECT COALESCE(SUM(minutes), 0) INTO allocated FROM payroll_pto_allocations WHERE origin_entry_id = NEW.origin_entry_id;
          SELECT COALESCE(SUM(e.minutes), 0) INTO resolved FROM payroll_pto_entries e
            WHERE e.origin_entry_id = NEW.origin_entry_id AND e.kind IN ('review_unpaid','review_waive','review_advance')
              AND e.origin_component IN ('opening','advance')
              AND NOT EXISTS (SELECT 1 FROM payroll_pto_entries child WHERE child.previous_entry_id = e.id);
          IF allocated + resolved + NEW.minutes > debt THEN RAISE EXCEPTION 'PTO obligation was already recovered'; END IF;
          RETURN NEW;
        END; $$;
      SQL
      TABLES.each do |table|
        execute "DROP TRIGGER IF EXISTS #{table}_immutable ON #{table}"
        execute "CREATE TRIGGER #{table}_immutable BEFORE UPDATE OR DELETE ON #{table} FOR EACH ROW EXECUTE FUNCTION protect_payroll_pto_history()"
      end
      execute "DROP TRIGGER IF EXISTS payroll_pto_policy_valid ON consultant_pto_policies"
      execute "CREATE TRIGGER payroll_pto_policy_valid BEFORE INSERT ON consultant_pto_policies FOR EACH ROW EXECUTE FUNCTION validate_payroll_pto_policy()"
      %w[entry recovery allocation].each do |kind|
        table = { "entry" => "payroll_pto_entries", "recovery" => "payroll_pto_recoveries", "allocation" => "payroll_pto_allocations" }.fetch(kind)
        execute "DROP TRIGGER IF EXISTS payroll_pto_#{kind}_valid ON #{table}"
        execute "CREATE TRIGGER payroll_pto_#{kind}_valid BEFORE INSERT ON #{table} FOR EACH ROW EXECUTE FUNCTION validate_payroll_pto_#{kind}()"
      end
    end
  end

  def down
    safety_assured do
      %w[policy entry recovery allocation].each { |kind| execute "DROP FUNCTION IF EXISTS validate_payroll_pto_#{kind}() CASCADE" }
      execute "DROP FUNCTION IF EXISTS protect_payroll_pto_history() CASCADE"
      remove_index :payroll_pto_entries, name: "pto_obligation_one_review_root"
    end
  end
end
