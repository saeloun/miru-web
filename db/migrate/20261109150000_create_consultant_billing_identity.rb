# frozen_string_literal: true

class CreateConsultantBillingIdentity < ActiveRecord::Migration[8.1]
  def up
    create_table :consultant_billing_submissions do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.references :previous_submission, index: { unique: true }
      t.references :pan_blob, foreign_key: { to_table: :active_storage_blobs }
      t.references :gst_blob, foreign_key: { to_table: :active_storage_blobs }
      t.text :facts, null: false
      t.text :evidence_manifest, null: false
      t.string :source_digest, null: false
      t.string :command_digest, null: false
      t.string :idempotency_key, null: false
      t.datetime :created_at, null: false
    end
    create_table :consultant_billing_reviews do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :submission, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.references :previous_review, index: { unique: true }
      t.string :decision, null: false
      t.text :reason, null: false
      t.boolean :manual_tax_reviewed, null: false
      t.boolean :missing_pan_acknowledged, null: false
      t.string :command_digest, null: false
      t.string :idempotency_key, null: false
      t.datetime :created_at, null: false
    end
    safety_assured do
      [:consultant_billing_submissions, :consultant_billing_reviews].each do |table|
        add_index table, [:company_id, :employment_id, :id], unique: true, name: "#{table}_tenant_identity"
        add_index table, [:employment_id, :idempotency_key], unique: true, name: "#{table}_command_identity"
        add_foreign_key table, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      end
      add_index :consultant_billing_submissions, :employment_id, unique: true, where: "previous_submission_id IS NULL", name: "billing_submission_one_root"
      add_foreign_key :consultant_billing_submissions, :consultant_billing_submissions,
        column: [:company_id, :employment_id, :previous_submission_id], primary_key: [:company_id, :employment_id, :id], name: "billing_submission_previous_tenant"
      add_foreign_key :consultant_billing_reviews, :consultant_billing_submissions,
        column: [:company_id, :employment_id, :submission_id], primary_key: [:company_id, :employment_id, :id], name: "billing_review_submission_tenant"
      add_index :consultant_billing_reviews, :submission_id, unique: true, where: "previous_review_id IS NULL", name: "billing_review_one_root"
      add_foreign_key :consultant_billing_reviews, :consultant_billing_reviews,
        column: [:company_id, :employment_id, :previous_review_id], primary_key: [:company_id, :employment_id, :id], name: "billing_review_previous_tenant"
      add_check_constraint :consultant_billing_submissions,
        "id>0 AND source_digest ~ '^[0-9a-f]{64}$' AND command_digest ~ '^[0-9a-f]{64}$' AND length(idempotency_key) BETWEEN 1 AND 128", name: "billing_submission_values"
      add_check_constraint :consultant_billing_reviews,
        "id>0 AND decision IN ('approved','needs_information','rejected') AND command_digest ~ '^[0-9a-f]{64}$' AND length(idempotency_key) BETWEEN 1 AND 128 AND (decision<>'approved' OR manual_tax_reviewed)", name: "billing_review_values"
      execute submission_guard
      execute review_guard
      [:consultant_billing_submissions, :consultant_billing_reviews].each do |table|
        execute "CREATE TRIGGER #{table}_immutable BEFORE UPDATE OR DELETE ON #{table} FOR EACH ROW EXECUTE FUNCTION public.protect_payroll_review_history()"
      end
    end
  end

  def down
    safety_assured { execute "LOCK TABLE consultant_billing_submissions, consultant_billing_reviews IN ACCESS EXCLUSIVE MODE" }
    if select_value("SELECT EXISTS(SELECT 1 FROM consultant_billing_submissions)")
      raise ActiveRecord::IrreversibleMigration, "Preserve adopted billing identity and review evidence"
    end
    drop_table :consultant_billing_reviews
    drop_table :consultant_billing_submissions
    safety_assured do
      execute "DROP FUNCTION public.validate_consultant_billing_review()"
      execute "DROP FUNCTION public.validate_consultant_billing_submission()"
    end
  end

  private

    def submission_guard
      <<~SQL
        CREATE FUNCTION public.validate_consultant_billing_submission() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE subject public.employments; previous public.consultant_billing_submissions;
        BEGIN
          SELECT * INTO subject FROM public.employments WHERE id=NEW.employment_id AND company_id=NEW.company_id FOR UPDATE;
          IF subject.id IS NULL OR subject.discarded_at IS NOT NULL OR subject.user_id<>NEW.actor_id OR
            NOT EXISTS(SELECT 1 FROM public.users WHERE id=NEW.actor_id AND discarded_at IS NULL AND current_workspace_id=NEW.company_id) OR
            NOT EXISTS(SELECT 1 FROM public.consultant_compensations WHERE employment_id=subject.id) THEN
            RAISE EXCEPTION 'Billing identity requires its own kept consultant';
          END IF;
          IF NEW.previous_submission_id IS NULL THEN
            IF EXISTS(SELECT 1 FROM public.consultant_billing_submissions WHERE employment_id=subject.id) THEN
              RAISE EXCEPTION 'Billing submission predecessor changed';
            END IF;
          ELSE
            SELECT * INTO previous FROM public.consultant_billing_submissions WHERE id=NEW.previous_submission_id;
            IF previous.id IS NULL OR previous.company_id<>NEW.company_id OR previous.employment_id<>NEW.employment_id OR previous.actor_id<>NEW.actor_id OR
              NEW.id<=previous.id OR EXISTS(SELECT 1 FROM public.consultant_billing_submissions WHERE previous_submission_id=previous.id) THEN
              RAISE EXCEPTION 'Billing submission predecessor changed';
            END IF;
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER consultant_billing_submission_valid BEFORE INSERT ON consultant_billing_submissions
          FOR EACH ROW EXECUTE FUNCTION public.validate_consultant_billing_submission();
      SQL
    end

    def review_guard
      <<~SQL
        CREATE FUNCTION public.validate_consultant_billing_review() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE subject public.employments; submission public.consultant_billing_submissions; previous public.consultant_billing_reviews;
        BEGIN
          SELECT * INTO subject FROM public.employments WHERE id=NEW.employment_id AND company_id=NEW.company_id FOR UPDATE;
          SELECT * INTO submission FROM public.consultant_billing_submissions WHERE id=NEW.submission_id AND company_id=NEW.company_id AND employment_id=NEW.employment_id;
          IF subject.id IS NULL OR subject.discarded_at IS NOT NULL OR submission.id IS NULL OR subject.user_id=NEW.actor_id OR submission.actor_id<>subject.user_id OR
            NOT EXISTS(SELECT 1 FROM public.users WHERE id=subject.user_id AND discarded_at IS NULL) OR
            NOT EXISTS(SELECT 1 FROM public.users WHERE id=NEW.actor_id AND discarded_at IS NULL AND current_workspace_id=NEW.company_id) OR
            NOT EXISTS(SELECT 1 FROM public.employments WHERE company_id=NEW.company_id AND user_id=NEW.actor_id AND discarded_at IS NULL) OR
            NOT EXISTS(SELECT 1 FROM public.roles r JOIN public.users_roles ur ON ur.role_id=r.id WHERE ur.user_id=NEW.actor_id AND r.resource_type='Company' AND r.resource_id=NEW.company_id AND
              (r.name IN ('owner','admin') OR r.name='book_keeper' AND EXISTS(SELECT 1 FROM public.payroll_runs WHERE company_id=NEW.company_id AND accounts_reviewer_id=NEW.actor_id))) OR
            EXISTS(SELECT 1 FROM public.consultant_billing_submissions WHERE previous_submission_id=submission.id) THEN
            RAISE EXCEPTION 'Billing review requires its current tenant and nonself reviewer';
          END IF;
          IF NEW.previous_review_id IS NULL THEN
            IF EXISTS(SELECT 1 FROM public.consultant_billing_reviews WHERE submission_id=submission.id) THEN
              RAISE EXCEPTION 'Billing review predecessor changed';
            END IF;
          ELSE
            SELECT * INTO previous FROM public.consultant_billing_reviews WHERE id=NEW.previous_review_id;
            IF previous.id IS NULL OR previous.submission_id<>submission.id OR NEW.id<=previous.id OR
              EXISTS(SELECT 1 FROM public.consultant_billing_reviews WHERE previous_review_id=previous.id) THEN
              RAISE EXCEPTION 'Billing review predecessor changed';
            END IF;
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER consultant_billing_review_valid BEFORE INSERT ON consultant_billing_reviews
          FOR EACH ROW EXECUTE FUNCTION public.validate_consultant_billing_review();
      SQL
    end
end
