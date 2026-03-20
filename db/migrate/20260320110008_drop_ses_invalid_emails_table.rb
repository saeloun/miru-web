# frozen_string_literal: true

class DropSesInvalidEmailsTable < ActiveRecord::Migration[8.0]
  def up
    # Drop the ses_invalid_emails table as we no longer track bounces internally
    # Postmark handles this externally
    safety_assured { drop_table :ses_invalid_emails if table_exists?(:ses_invalid_emails) }
  end

  def down
    # Recreate the table if we need to rollback
    unless table_exists?(:ses_invalid_emails)
      create_table :ses_invalid_emails do |t|
        t.string :email
        t.boolean :bounce, default: false
        t.boolean :compliant, default: false
        t.timestamps
      end
    end
  end
end
