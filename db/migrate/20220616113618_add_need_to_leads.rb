# frozen_string_literal: true

class AddNeedToLeads < ActiveRecord::Migration[7.0]
  def change
    remove_column :leads, :priority
    add_column :leads, :need, :integer
    add_column :leads, :preferred_contact_method_code, :integer
    add_column :leads, :initial_communication, :integer
    add_column :leads, :first_name, :string
    add_column :leads, :last_name, :string
    add_column :leads, :source_code, :integer
    add_column :leads, :tech_stack_ids, :text, array: true, default: []
    add_column :leads, :emails, :text, array: true, default: []
    add_column :leads, :priority_code, :integer
    add_column :leads, :title, :string
  end
end
