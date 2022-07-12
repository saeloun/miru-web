# frozen_string_literal: true

class ChangeHourlyRateToBeStringInProjectMembers < ActiveRecord::Migration[7.0]
  def change
    change_column :project_members, :hourly_rate, :string, default: "0.0"
  end
end
