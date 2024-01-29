# frozen_string_literal: true

class AddDiscardedAtToHolidayInfos < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :holiday_infos, :discarded_at, :datetime
    add_index :holiday_infos, :discarded_at, algorithm: :concurrently
  end
end
