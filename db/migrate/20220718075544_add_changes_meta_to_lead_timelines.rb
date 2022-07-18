# frozen_string_literal: true

class AddChangesMetaToLeadTimelines < ActiveRecord::Migration[7.0]
  def change
    remove_column :leads, :name, :string
    add_column :lead_timelines, :meta_action, :integer
    add_column :lead_timelines, :meta_previous_changes, :text
  end
end
