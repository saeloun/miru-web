# frozen_string_literal: true

class AddFieldsToInvitations < ActiveRecord::Migration[7.0]
  def change
    add_column :invitations, :department_id, :integer
    add_column :invitations, :team_lead, :boolean
  end
end
