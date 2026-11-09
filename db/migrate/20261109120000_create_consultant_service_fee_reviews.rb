# frozen_string_literal: true

class CreateConsultantServiceFeeReviews < ActiveRecord::Migration[8.1]
  def up
    create_table :consultant_service_fee_reviews do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.date :period, null: false
      t.bigint :amount_minor, null: false
      t.text :reason, null: false
      t.string :source_digest, null: false
      t.jsonb :context, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :idempotency_key, null: false
      t.references :previous_review, index: { unique: true }
      t.datetime :created_at, null: false
    end
    add_index :consultant_service_fee_reviews, [:company_id, :employment_id, :id], unique: true, name: "service_fee_tenant_identity"
    add_index :consultant_service_fee_reviews, [:employment_id, :period], unique: true, where: "previous_review_id IS NULL", name: "service_fee_one_root"
    add_index :consultant_service_fee_reviews, [:employment_id, :idempotency_key], unique: true, name: "service_fee_command_identity"
    safety_assured do
      add_foreign_key :consultant_service_fee_reviews, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      add_foreign_key :consultant_service_fee_reviews, :consultant_service_fee_reviews,
        column: [:company_id, :employment_id, :previous_review_id], primary_key: [:company_id, :employment_id, :id], name: "service_fee_previous_tenant"
    end
    add_check_constraint :consultant_service_fee_reviews,
      "amount_minor > 0 AND amount_minor < 100000000000000 AND EXTRACT(DAY FROM period)=1 AND period BETWEEN '1900-01-01' AND '2099-12-01' AND length(btrim(reason)) BETWEEN 1 AND 1000 AND source_digest ~ '^[0-9a-f]{64}$' AND jsonb_typeof(context)='object' AND length(idempotency_key) BETWEEN 1 AND 128",
      name: "service_fee_review_values"
    safety_assured do
      execute <<~SQL
      CREATE FUNCTION validate_consultant_service_fee_review() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE previous public.consultant_service_fee_reviews;
      BEGIN
        PERFORM id FROM public.payroll_runs WHERE company_id=NEW.company_id AND period>=NEW.period ORDER BY id FOR UPDATE;
        PERFORM id FROM public.employments WHERE id=NEW.employment_id AND company_id=NEW.company_id FOR UPDATE;
        IF NEW.previous_review_id IS NOT NULL THEN
          SELECT * INTO previous FROM public.consultant_service_fee_reviews WHERE id=NEW.previous_review_id;
          IF previous.id IS NULL OR previous.company_id<>NEW.company_id OR previous.employment_id<>NEW.employment_id OR previous.period<>NEW.period OR
             EXISTS(SELECT 1 FROM public.consultant_service_fee_reviews WHERE previous_review_id=previous.id) THEN
            RAISE EXCEPTION 'Service fee predecessor changed';
          END IF;
        END IF;
        IF EXISTS(SELECT 1 FROM public.payroll_india_handoffs h JOIN public.payroll_runs r ON r.id=h.payroll_run_id
          WHERE r.company_id=NEW.company_id AND r.period>=NEW.period AND h.employment_id=NEW.employment_id AND h.released_at IS NULL) OR
          EXISTS(SELECT 1 FROM public.payroll_payment_instructions i JOIN public.payroll_payment_groups g ON g.id=i.payroll_payment_group_id
            JOIN public.payroll_runs r ON r.id=g.payroll_run_id WHERE r.company_id=NEW.company_id AND r.period>=NEW.period AND g.employment_id=NEW.employment_id
            AND i.released_at IS NULL AND i.submission_state <> 'prepared') THEN
          RAISE EXCEPTION 'Service fee has protected bank activity';
        END IF;
        IF EXISTS(SELECT 1 FROM public.payroll_pto_entries e WHERE e.company_id=NEW.company_id AND e.employment_id=NEW.employment_id
          AND e.period=NEW.period AND e.case_key='month:'||to_char(NEW.period,'YYYY-MM-DD') AND NOT EXISTS(SELECT 1 FROM public.payroll_pto_entries child WHERE child.previous_entry_id=e.id)
          AND (EXISTS(SELECT 1 FROM public.payroll_pto_allocations a WHERE a.origin_entry_id=e.id) OR
            EXISTS(SELECT 1 FROM public.payroll_pto_entries r WHERE r.origin_entry_id=e.id AND r.kind IN ('review_unpaid','review_waive','review_advance')
              AND NOT EXISTS(SELECT 1 FROM public.payroll_pto_entries child WHERE child.previous_entry_id=r.id)) OR
            EXISTS(SELECT 1 FROM public.payroll_pto_recoveries r WHERE r.payroll_pto_entry_id=e.id AND r.kind<>'released'
              AND NOT EXISTS(SELECT 1 FROM public.payroll_pto_recoveries child WHERE child.previous_recovery_id=r.id)))) THEN
          RAISE EXCEPTION 'Service fee has protected PTO history';
        END IF;
        RETURN NEW;
      END; $$;
      CREATE TRIGGER consultant_service_fee_review_valid BEFORE INSERT ON consultant_service_fee_reviews
        FOR EACH ROW EXECUTE FUNCTION validate_consultant_service_fee_review();
      CREATE TRIGGER consultant_service_fee_reviews_immutable BEFORE UPDATE OR DELETE ON consultant_service_fee_reviews
        FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
      SQL
    end
  end

  def down
    safety_assured { execute "LOCK TABLE consultant_service_fee_reviews IN ACCESS EXCLUSIVE MODE" }
    if select_value("SELECT EXISTS(SELECT 1 FROM consultant_service_fee_reviews)")
      raise ActiveRecord::IrreversibleMigration, "Preserve adopted service-fee reviews before rollback"
    end
    drop_table :consultant_service_fee_reviews
    safety_assured { execute "DROP FUNCTION validate_consultant_service_fee_review()" }
  end
end
