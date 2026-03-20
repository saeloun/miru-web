# frozen_string_literal: true

class AddUserToExpenses < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_reference :expenses, :user, index: { algorithm: :concurrently }
  end
end
