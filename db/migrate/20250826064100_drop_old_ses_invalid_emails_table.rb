class DropOldSesInvalidEmailsTable < ActiveRecord::Migration[8.0]
  def up
    # Drop the old SES table now that we've migrated to invalid_emails
    safety_assured { drop_table :ses_invalid_emails if table_exists?(:ses_invalid_emails) }
  end
  
  def down
    # Recreate the old table in case we need to rollback
    unless table_exists?(:ses_invalid_emails)
      create_table :ses_invalid_emails do |t|
        t.string :email
        t.boolean :bounce, default: false
        t.boolean :compliant, default: false
        t.timestamps
      end
    end
    
    # Copy data back from new table if it exists
    if table_exists?(:invalid_emails) && table_exists?(:ses_invalid_emails)
      safety_assured do
        execute <<-SQL
          INSERT INTO ses_invalid_emails (email, bounce, compliant, created_at, updated_at)
          SELECT email, bounce, compliant, created_at, updated_at
          FROM invalid_emails
        SQL
      end
    end
  end
end