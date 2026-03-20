# frozen_string_literal: true

class AddTotpSupportToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :otp_secret_ciphertext, :text unless column_exists?(:users, :otp_secret_ciphertext)
    add_column :users, :otp_required_for_login, :boolean, default: false, null: false unless column_exists?(:users, :otp_required_for_login)
    add_column :users, :otp_last_used_at, :integer unless column_exists?(:users, :otp_last_used_at)
    add_column :users, :otp_recovery_codes_digest, :jsonb, default: [], null: false unless column_exists?(:users, :otp_recovery_codes_digest)
    add_column :users, :otp_recovery_codes_generated_at, :datetime unless column_exists?(:users, :otp_recovery_codes_generated_at)
  end
end
