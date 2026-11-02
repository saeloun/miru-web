# frozen_string_literal: true

class EncryptTotpSecrets < ActiveRecord::Migration[8.1]
  class TotpUser < ActiveRecord::Base
    self.table_name = "users"
    encrypts :otp_secret_ciphertext, support_unencrypted_data: true
  end

  def up
    TotpUser.where.not(otp_secret_ciphertext: nil).find_each do |user|
      user.with_lock { user.encrypt unless user.encrypted_attribute?(:otp_secret_ciphertext) }
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Authenticator secrets must remain encrypted"
  end
end
