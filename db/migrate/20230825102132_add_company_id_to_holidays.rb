# frozen_string_literal: true

class AddCompanyIdToHolidays < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :holidays, :company, null: false, index: { algorithm: :concurrently }
  end
end
