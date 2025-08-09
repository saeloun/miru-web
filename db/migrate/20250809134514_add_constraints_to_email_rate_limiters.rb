# frozen_string_literal: true

class AddConstraintsToEmailRateLimiters < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    # Add unique index on user_id
    add_index :email_rate_limiters, :user_id,
      unique: true,
      if_not_exists: true,
      algorithm: :concurrently

    # Add check constraint to ensure non-negative email counts
    add_check_constraint :email_rate_limiters,
      "number_of_emails_sent >= 0",
      name: "email_rate_limiters_non_negative_count",
      validate: false
  end
end
