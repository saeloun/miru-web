# frozen_string_literal: true

class AddDiscardedAtToLeadTabels < ActiveRecord::Migration[7.0]
  def change
    add_column :lead_line_items, :discarded_at, :datetime
    add_index :lead_line_items, :discarded_at

    add_column :lead_timelines, :discarded_at, :datetime
    add_index :lead_timelines, :discarded_at

    rename_column :lead_line_items, :numbert_of_resource, :number_of_resource
  end
end
