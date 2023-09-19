# frozen_string_literal: true

class AddClientToInvitationsWithoutForeignKey < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :invitations, :client, index: { algorithm: :concurrently }
  end
end
