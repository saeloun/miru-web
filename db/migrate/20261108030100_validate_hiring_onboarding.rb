# frozen_string_literal: true

class ValidateHiringOnboarding < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    add_index :invitations, :hiring_offer_id, unique: true, algorithm: :concurrently
    add_index :hiring_offers, :employment_id, algorithm: :concurrently
    validate_foreign_key :invitations, :hiring_offers, column: [:company_id, :hiring_offer_id]
    validate_foreign_key :hiring_offers, :employments, column: [:company_id, :employment_id]
    validate_check_constraint :hiring_offers, name: "hiring_offer_onboarding_state"
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_offers WHERE onboarding_started_at IS NOT NULL) OR EXISTS (SELECT 1 FROM invitations WHERE hiring_offer_id IS NOT NULL)")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded hiring onboarding before rolling back."
    end

    remove_index :hiring_offers, :employment_id, algorithm: :concurrently
    remove_index :invitations, :hiring_offer_id, algorithm: :concurrently
  end
end
