# frozen_string_literal: true

class CreatePayrollMercuryPayments < ActiveRecord::Migration[8.1]
  APPEND_ONLY_TABLES = %w[payroll_mercury_recipient_links payroll_payment_events].freeze

  def up
    create_table :payroll_expense_reservations do |t|
      t.references :company, null: false, foreign_key: true
      t.references :expense, null: false, foreign_key: true
      t.references :payroll_run, null: false, foreign_key: true
      t.references :payroll_revision, null: false, foreign_key: true
      t.references :employment, null: false, foreign_key: true
      t.bigint :amount_minor, null: false
      t.datetime :settled_at
      t.datetime :released_at
      t.timestamps
    end
    add_index :payroll_expense_reservations, :expense_id, unique: true, where: "released_at IS NULL",
      name: "index_payroll_expense_reservations_one_active"
    add_check_constraint :payroll_expense_reservations, "amount_minor > 0", name: "payroll_expense_reservation_amount"

    create_table :payroll_split_arrangements do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false, foreign_key: true
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.references :verified_by, foreign_key: { to_table: :users }
      t.references :approved_by, foreign_key: { to_table: :users }
      t.references :withdrawn_by, foreign_key: { to_table: :users }
      t.text :details, null: false
      t.string :allocation_kind, null: false
      t.decimal :allocation_value, precision: 14, scale: 2, null: false
      t.string :allocated_to, null: false
      t.string :remainder_to, null: false
      t.datetime :verified_at
      t.datetime :approved_at
      t.datetime :withdrawn_at
      t.timestamps
    end
    add_check_constraint :payroll_split_arrangements, "allocation_kind IN ('percentage', 'fixed_inr')", name: "payroll_split_kind"
    add_check_constraint :payroll_split_arrangements, "allocation_value > 0", name: "payroll_split_value"
    add_check_constraint :payroll_split_arrangements,
      "allocated_to IN ('consultant', 'spouse') AND remainder_to IN ('consultant', 'spouse') AND allocated_to <> remainder_to",
      name: "payroll_split_parties"

    create_table :payroll_mercury_connections do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.references :configured_by, null: false, foreign_key: { to_table: :users }
      t.references :verified_by, foreign_key: { to_table: :users }
      t.text :api_token, null: false
      t.string :environment, null: false
      t.string :source_account_id, null: false
      t.string :expected_legal_business_name, null: false
      t.bigint :wire_fee_minor, null: false, default: 1500
      t.integer :credential_version, null: false, default: 1
      t.integer :verified_version
      t.datetime :verified_at
      t.string :verified_account_name
      t.string :verified_account_mask
      t.timestamps
    end
    add_check_constraint :payroll_mercury_connections, "environment IN ('live', 'sandbox')", name: "payroll_mercury_connection_environment"
    add_check_constraint :payroll_mercury_connections, "wire_fee_minor > 0", name: "payroll_mercury_connection_fee"

    create_table :payroll_mercury_recipient_links do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false, foreign_key: true
      t.references :split_arrangement, foreign_key: { to_table: :payroll_split_arrangements }
      t.references :verified_by, null: false, foreign_key: { to_table: :users }
      t.string :beneficiary, null: false
      t.string :mercury_recipient_id, null: false
      t.string :recipient_digest, null: false
      t.string :bank_details_digest, null: false
      t.string :display_name, null: false
      t.string :account_mask, null: false
      t.string :swift_code, null: false
      t.timestamps
    end
    add_check_constraint :payroll_mercury_recipient_links, "beneficiary IN ('consultant', 'spouse')", name: "payroll_recipient_beneficiary"

    create_table :payroll_payment_groups do |t|
      t.references :company, null: false, foreign_key: true
      t.references :payroll_run, null: false, foreign_key: true
      t.references :payroll_revision, null: false, foreign_key: true
      t.references :employment, null: false, foreign_key: true
      t.references :split_arrangement, foreign_key: { to_table: :payroll_split_arrangements }
      t.string :line_digest, null: false
      t.bigint :entitlement_minor, null: false
      t.bigint :reimbursement_minor, null: false, default: 0
      t.integer :required_legs, null: false
      t.datetime :fully_credited_at
      t.timestamps
    end
    add_index :payroll_payment_groups, [:payroll_run_id, :employment_id], unique: true
    add_check_constraint :payroll_payment_groups, "entitlement_minor > 0", name: "payroll_payment_group_entitlement"
    add_check_constraint :payroll_payment_groups, "required_legs IN (1, 2)", name: "payroll_payment_group_legs"

    create_table :payroll_payment_instructions do |t|
      t.references :company, null: false, foreign_key: true
      t.references :payroll_payment_group, null: false, foreign_key: true
      t.references :payroll_run, null: false, foreign_key: true
      t.references :payroll_revision, null: false, foreign_key: true
      t.references :employment, null: false, foreign_key: true
      t.references :consultant_compensation, null: false, foreign_key: true
      t.references :recipient_link, null: false, foreign_key: { to_table: :payroll_mercury_recipient_links }
      t.references :prepared_by, null: false, foreign_key: { to_table: :users }
      t.references :rate_entered_by, foreign_key: { to_table: :users }
      t.references :submitted_by, foreign_key: { to_table: :users }
      t.references :absent_confirmed_by, foreign_key: { to_table: :users }
      t.string :beneficiary, null: false
      t.integer :connection_version, null: false
      t.string :environment, null: false
      t.string :source_account_id, null: false
      t.string :revision_digest, null: false
      t.string :bank_details_digest, null: false
      t.string :recipient_digest, null: false
      t.string :mercury_recipient_id, null: false
      t.bigint :entitlement_minor, null: false
      t.string :entitlement_currency, null: false, default: "INR"
      t.decimal :reference_rate, precision: 18, scale: 10, null: false
      t.decimal :buffered_rate, precision: 18, scale: 10, null: false
      t.string :rate_source, null: false
      t.string :rate_mode, null: false
      t.datetime :rate_observed_at, null: false
      t.datetime :rate_valid_until, null: false
      t.bigint :principal_minor, null: false
      t.bigint :fee_minor, null: false
      t.bigint :company_debit_minor, null: false
      t.string :charge_type, null: false, default: "ours"
      t.string :purpose_category, null: false
      t.string :purpose_info, null: false
      t.string :idempotency_key, null: false
      t.string :frozen_digest, null: false
      t.string :submission_state, null: false, default: "prepared"
      t.integer :submission_attempts, null: false, default: 0
      t.datetime :submission_started_at
      t.datetime :absent_confirmed_at
      t.string :provider_request_id
      t.string :request_status
      t.datetime :provider_request_created_at
      t.datetime :request_approved_at
      t.boolean :requester_may_approve
      t.integer :approvers_required
      t.date :scheduled_send_on
      t.string :provider_transaction_id
      t.string :transaction_status
      t.string :transaction_link_state, null: false, default: "none"
      t.string :transaction_failure_reason
      t.string :credit_state, null: false, default: "none"
      t.bigint :credited_minor, null: false, default: 0
      t.string :last_error_code
      t.datetime :last_checked_at
      t.datetime :released_at
      t.timestamps
    end
    add_index :payroll_payment_instructions, [:company_id, :idempotency_key], unique: true
    add_index :payroll_payment_instructions, [:payroll_payment_group_id, :beneficiary], unique: true,
      where: "released_at IS NULL", name: "index_payroll_payment_instructions_one_open_leg"
    add_index :payroll_payment_instructions, [:company_id, :provider_request_id], unique: true,
      where: "provider_request_id IS NOT NULL", name: "index_payroll_payment_instructions_on_provider_request"
    add_index :payroll_payment_instructions, [:company_id, :provider_transaction_id], unique: true,
      where: "provider_transaction_id IS NOT NULL", name: "index_payroll_payment_instructions_on_provider_transaction"
    add_check_constraint :payroll_payment_instructions, "beneficiary IN ('consultant', 'spouse')", name: "payroll_payment_beneficiary"
    add_check_constraint :payroll_payment_instructions, "environment IN ('live', 'sandbox')", name: "payroll_payment_environment"
    add_check_constraint :payroll_payment_instructions, "entitlement_currency = 'INR'", name: "payroll_payment_entitlement_currency"
    add_check_constraint :payroll_payment_instructions, "entitlement_minor > 0", name: "payroll_payment_entitlement_positive"
    add_check_constraint :payroll_payment_instructions, "principal_minor BETWEEN 1 AND 1000000000", name: "payroll_payment_principal_range"
    add_check_constraint :payroll_payment_instructions, "fee_minor > 0", name: "payroll_payment_fee"
    add_check_constraint :payroll_payment_instructions, "company_debit_minor = principal_minor + fee_minor", name: "payroll_payment_company_debit"
    add_check_constraint :payroll_payment_instructions, "charge_type = 'ours'", name: "payroll_payment_charge_type"
    add_check_constraint :payroll_payment_instructions, "rate_mode IN ('exchange_rate', 'manual')", name: "payroll_payment_rate_mode"
    add_check_constraint :payroll_payment_instructions, "credited_minor >= 0", name: "payroll_payment_credit"
    add_check_constraint :payroll_payment_instructions,
      "submission_state IN ('prepared', 'submitting', 'accepted', 'uncertain', 'rejected', 'voided')", name: "payroll_payment_submission_state"
    add_check_constraint :payroll_payment_instructions,
      "request_status IS NULL OR request_status IN ('pendingApproval', 'approved', 'rejected', 'cancelled')", name: "payroll_payment_request_status"
    add_check_constraint :payroll_payment_instructions,
      "transaction_status IS NULL OR transaction_status IN ('pending', 'sent', 'cancelled', 'failed', 'reversed', 'blocked')", name: "payroll_payment_transaction_status"
    add_check_constraint :payroll_payment_instructions,
      "transaction_link_state IN ('none', 'linked', 'reconciliation_required')", name: "payroll_payment_link_state"
    add_check_constraint :payroll_payment_instructions,
      "credit_state IN ('none', 'partial', 'credited', 'shortfall_resolved')", name: "payroll_payment_credit_state"

    create_table :payroll_payment_events do |t|
      t.references :payroll_payment_instruction, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.jsonb :data, null: false, default: {}
      t.timestamps
    end

    safety_assured do
      APPEND_ONLY_TABLES.each do |table|
        execute <<~SQL
          CREATE TRIGGER #{table}_immutable BEFORE UPDATE OR DELETE ON #{table}
          FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
        SQL
      end
    end
  end

  def down
    drop_table :payroll_payment_events
    drop_table :payroll_payment_instructions
    drop_table :payroll_payment_groups
    drop_table :payroll_mercury_recipient_links
    drop_table :payroll_mercury_connections
    drop_table :payroll_split_arrangements
    drop_table :payroll_expense_reservations
  end
end
