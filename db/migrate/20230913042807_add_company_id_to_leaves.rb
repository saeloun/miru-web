# frozen_string_literal: true

class AddCompanyIdToLeaves < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :leaves, :company, null: false, index: { algorithm: :concurrently }
  end
end
