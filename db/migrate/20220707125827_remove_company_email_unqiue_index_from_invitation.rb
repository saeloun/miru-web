# frozen_string_literal: true

class RemoveCompanyEmailUnqiueIndexFromInvitation < ActiveRecord::Migration[7.0]
  def change
    remove_index :invitations, [:company_id, :recipient_email], unique: true
  end
end
