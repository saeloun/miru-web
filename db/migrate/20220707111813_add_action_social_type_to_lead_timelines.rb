# frozen_string_literal: true

class AddActionSocialTypeToLeadTimelines < ActiveRecord::Migration[7.0]
  def change
    add_column :lead_timelines, :action_social_type, :string
    add_column :lead_timelines, :action_social_id, :string
  end
end
