# frozen_string_literal: true

class AddForeignKeyToInvitationsForClient < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_foreign_key :invitations, :clients, algorithm: :concurrently, validate: false
  end
end
