# frozen_string_literal: true

class AddTrialEmailLastSentOnToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :trial_email_last_sent_on, :date
  end
end
