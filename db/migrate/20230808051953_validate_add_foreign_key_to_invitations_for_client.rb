# frozen_string_literal: true

class ValidateAddForeignKeyToInvitationsForClient < ActiveRecord::Migration[7.0]
  def change
    validate_foreign_key :invitations, :clients
  end
end
