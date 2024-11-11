# frozen_string_literal: true

class CreateEmailRateLimiters < ActiveRecord::Migration[7.1]
  def change
    create_table :email_rate_limiters do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :number_of_emails_sent, default: 0
      t.datetime :current_interval_started_at

      t.timestamps
    end
  end
end
