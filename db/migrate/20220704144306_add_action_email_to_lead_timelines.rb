# frozen_string_literal: true

class AddActionEmailToLeadTimelines < ActiveRecord::Migration[7.0]
  def change
    add_column :lead_timelines, :action_email, :string
    add_column :lead_timelines, :action_phone_number, :string
    add_column :lead_timelines, :action_schedule_status_code, :integer
  end
end
