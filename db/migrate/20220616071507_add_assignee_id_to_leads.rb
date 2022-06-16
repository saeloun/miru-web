# frozen_string_literal: true

class AddAssigneeIdToLeads < ActiveRecord::Migration[7.0]
  def change
    add_reference :leads, :assignee, foreign_key: { to_table: :users }
    add_reference :leads, :reporter, foreign_key: { to_table: :users }
    add_reference :leads, :created_by, foreign_key: { to_table: :users }
    add_reference :leads, :updated_by, foreign_key: { to_table: :users }
  end
end
