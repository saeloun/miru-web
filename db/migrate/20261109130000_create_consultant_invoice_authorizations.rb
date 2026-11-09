# frozen_string_literal: true

class CreateConsultantInvoiceAuthorizations < ActiveRecord::Migration[8.1]
  def up
    create_table :consultant_invoice_authorizations do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :statement_version, null: false
      t.text :statement_text, null: false
      t.string :statement_digest, null: false
      t.string :command_digest, null: false
      t.string :idempotency_key, null: false
      t.references :previous_event, index: { unique: true }
      t.datetime :created_at, null: false
    end
    add_index :consultant_invoice_authorizations, [:company_id, :employment_id, :id], unique: true, name: "invoice_authorization_tenant_identity"
    add_index :consultant_invoice_authorizations, :employment_id, unique: true, where: "previous_event_id IS NULL", name: "invoice_authorization_one_root"
    add_index :consultant_invoice_authorizations, [:employment_id, :idempotency_key], unique: true, name: "invoice_authorization_command_identity"
    safety_assured do
      add_foreign_key :consultant_invoice_authorizations, :employments,
        column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      add_foreign_key :consultant_invoice_authorizations, :consultant_invoice_authorizations,
        column: [:company_id, :employment_id, :previous_event_id], primary_key: [:company_id, :employment_id, :id], name: "invoice_authorization_previous_tenant"
    end
    add_check_constraint :consultant_invoice_authorizations,
      "id > 0 AND action IN ('grant','withdraw') AND length(statement_version) BETWEEN 1 AND 128 AND length(statement_text) BETWEEN 1 AND 4000 AND statement_digest ~ '^[0-9a-f]{64}$' AND command_digest ~ '^[0-9a-f]{64}$' AND length(idempotency_key) BETWEEN 1 AND 128",
      name: "invoice_authorization_event_values"
    safety_assured do
      execute <<~SQL
        CREATE FUNCTION public.validate_consultant_invoice_authorization() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE subject public.employments; previous public.consultant_invoice_authorizations;
        BEGIN
          SELECT * INTO subject FROM public.employments WHERE id=NEW.employment_id AND company_id=NEW.company_id FOR UPDATE;
          IF subject.id IS NULL OR subject.discarded_at IS NOT NULL OR subject.user_id<>NEW.actor_id OR
            NOT EXISTS(SELECT 1 FROM public.users WHERE id=NEW.actor_id AND discarded_at IS NULL AND current_workspace_id=NEW.company_id) THEN
            RAISE EXCEPTION 'Invoice authorization requires its own kept consultant';
          END IF;
          IF NEW.previous_event_id IS NULL THEN
            IF NEW.action<>'grant' OR EXISTS(SELECT 1 FROM public.consultant_invoice_authorizations WHERE employment_id=NEW.employment_id) THEN
              RAISE EXCEPTION 'Invoice authorization predecessor changed';
            END IF;
          ELSE
            SELECT * INTO previous FROM public.consultant_invoice_authorizations WHERE id=NEW.previous_event_id;
            IF previous.id IS NULL OR previous.company_id<>NEW.company_id OR previous.employment_id<>NEW.employment_id OR
              previous.actor_id<>NEW.actor_id OR NEW.id<=previous.id OR
              EXISTS(SELECT 1 FROM public.consultant_invoice_authorizations WHERE previous_event_id=previous.id) THEN
              RAISE EXCEPTION 'Invoice authorization predecessor changed';
            END IF;
            IF NEW.action='withdraw' AND (previous.action<>'grant' OR
              (NEW.statement_version,NEW.statement_text,NEW.statement_digest) IS DISTINCT FROM
              (previous.statement_version,previous.statement_text,previous.statement_digest)) THEN
              RAISE EXCEPTION 'Withdrawal must retain the granted statement';
            END IF;
            IF NEW.action='grant' AND previous.action='grant' AND
              (NEW.statement_version,NEW.statement_text,NEW.statement_digest) IS NOT DISTINCT FROM
              (previous.statement_version,previous.statement_text,previous.statement_digest) THEN
              RAISE EXCEPTION 'Invoice authorization is already granted';
            END IF;
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER consultant_invoice_authorization_valid BEFORE INSERT ON consultant_invoice_authorizations
          FOR EACH ROW EXECUTE FUNCTION public.validate_consultant_invoice_authorization();
        CREATE TRIGGER consultant_invoice_authorizations_immutable BEFORE UPDATE OR DELETE ON consultant_invoice_authorizations
          FOR EACH ROW EXECUTE FUNCTION public.protect_payroll_review_history();
      SQL
    end
  end

  def down
    safety_assured { execute "LOCK TABLE consultant_invoice_authorizations IN ACCESS EXCLUSIVE MODE" }
    if select_value("SELECT EXISTS(SELECT 1 FROM consultant_invoice_authorizations)")
      raise ActiveRecord::IrreversibleMigration, "Preserve adopted consultant invoice authorization history"
    end
    drop_table :consultant_invoice_authorizations
    safety_assured { execute "DROP FUNCTION public.validate_consultant_invoice_authorization()" }
  end
end
