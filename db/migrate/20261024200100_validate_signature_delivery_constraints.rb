# frozen_string_literal: true

class ValidateSignatureDeliveryConstraints < ActiveRecord::Migration[8.1]
  def change
    validate_foreign_key :signature_request_revisions, :signature_connections
    validate_check_constraint :signature_request_revisions, name: "signature_revisions_reminder_count"
  end
end
