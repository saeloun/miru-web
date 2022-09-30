# frozen_string_literal: true

class AddCompanyAndEmailUnqiueIndexToInvitation < ActiveRecord::Migration[7.0]
  def change
    add_index :invitations, [:company_id, :recipient_email], unique: true
  end
end
