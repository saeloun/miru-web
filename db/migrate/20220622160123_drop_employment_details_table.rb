# frozen_string_literal: true

class DropEmploymentDetailsTable < ActiveRecord::Migration[7.0]
  def change
    drop_table :employment_details
  end
end
