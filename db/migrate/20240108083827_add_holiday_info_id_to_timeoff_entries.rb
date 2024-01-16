# frozen_string_literal: true

class AddHolidayInfoIdToTimeoffEntries < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :timeoff_entries, :holiday_info, index: { algorithm: :concurrently }
  end
end
