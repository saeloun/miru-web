# frozen_string_literal: true

class AddColumnsToCandidates < ActiveRecord::Migration[7.0]
  def change
    add_column :candidates, :title, :string, before: :first_name
    add_column :candidates, :emails, :text, default: [], array: true, after: :email
    add_column :candidates, :address, :text
    add_column :candidates, :country, :string
    add_column :candidates, :mobilephone, :string
    add_column :candidates, :telephone, :string
    add_column :candidates, :skypeid, :string
    add_column :candidates, :linkedinid, :string
    add_column :candidates, :description, :string
    add_column :candidates, :cover_letter, :text
    add_column :candidates, :status_code, :integer
    add_column :candidates, :preferred_contact_method_code, :integer
    add_column :candidates, :initial_communication, :integer
    add_column :candidates, :tech_stack_ids, :text, default: [], array: true
    add_column :candidates, :source_code, :integer
    add_column :candidates, :assignee_id, :bigint
    add_index :candidates, :assignee_id
    add_column :candidates, :reporter_id, :bigint
    add_index :candidates, :reporter_id
    add_column :candidates, :created_by_id, :bigint
    add_index :candidates, :created_by_id
    add_column :candidates, :updated_by_id, :bigint
    add_index :candidates, :updated_by_id
    add_column :candidates, :company_id, :bigint
    add_index :candidates, :company_id
  end
end
