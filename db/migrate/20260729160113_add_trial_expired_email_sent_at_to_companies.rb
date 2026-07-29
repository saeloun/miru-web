# frozen_string_literal: true

class AddTrialExpiredEmailSentAtToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :trial_expired_email_sent_at, :datetime
  end
end
