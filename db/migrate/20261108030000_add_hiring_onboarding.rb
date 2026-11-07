# frozen_string_literal: true

class AddHiringOnboarding < ActiveRecord::Migration[8.1]
  def up
    add_column :hiring_offers, :onboarding_details, :text
    add_column :hiring_offers, :onboarding_completion_details, :text
    add_column :hiring_offers, :onboarding_started_at, :datetime
    add_column :hiring_offers, :onboarded_at, :datetime
    add_column :hiring_offers, :employment_id, :bigint
    add_column :invitations, :hiring_offer_id, :bigint
    add_foreign_key :hiring_offers, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id], validate: false
    add_foreign_key :invitations, :hiring_offers, column: [:company_id, :hiring_offer_id], primary_key: [:company_id, :id], on_delete: :cascade, validate: false
    add_check_constraint :hiring_offers,
      "(onboarding_started_at IS NULL AND onboarding_details IS NULL AND onboarded_at IS NULL AND employment_id IS NULL AND onboarding_completion_details IS NULL) OR " \
      "(state = 'accepted' AND onboarding_started_at IS NOT NULL AND onboarding_details IS NOT NULL AND " \
      "((onboarded_at IS NULL AND employment_id IS NULL AND onboarding_completion_details IS NULL) OR " \
      "(onboarded_at IS NOT NULL AND employment_id IS NOT NULL AND onboarding_completion_details IS NOT NULL)))",
      name: "hiring_offer_onboarding_state", validate: false
  end

  def down
    if select_value("SELECT EXISTS (SELECT 1 FROM hiring_offers WHERE onboarding_started_at IS NOT NULL) OR EXISTS (SELECT 1 FROM invitations WHERE hiring_offer_id IS NOT NULL)")
      raise ActiveRecord::IrreversibleMigration, "Preserve recorded hiring onboarding before rolling back."
    end

    remove_check_constraint :hiring_offers, name: "hiring_offer_onboarding_state"
    remove_foreign_key :invitations, :hiring_offers, column: [:company_id, :hiring_offer_id]
    remove_foreign_key :hiring_offers, :employments, column: [:company_id, :employment_id]
    remove_column :invitations, :hiring_offer_id
    remove_columns :hiring_offers, :employment_id, :onboarding_details, :onboarding_completion_details, :onboarding_started_at, :onboarded_at
  end
end
