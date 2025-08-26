class RenameSesTablesToGenericEmailTracking < ActiveRecord::Migration[8.0]
  def up
    # Create new table with better name
    unless table_exists?(:invalid_emails)
      create_table :invalid_emails do |t|
        t.string :email, null: false
        t.boolean :bounce, default: false
        t.boolean :compliant, default: false
        t.timestamps
        
        t.index :email, unique: true
        t.index [:email, :bounce]
        t.index [:email, :compliant]
      end
    end
    
    # Copy data from old table to new table if it exists
    if table_exists?(:ses_invalid_emails) && table_exists?(:invalid_emails)
      safety_assured do
        execute <<-SQL
          INSERT INTO invalid_emails (email, bounce, compliant, created_at, updated_at)
          SELECT email, bounce, compliant, created_at, updated_at
          FROM ses_invalid_emails
          ON CONFLICT (email) DO UPDATE 
          SET bounce = EXCLUDED.bounce,
              compliant = EXCLUDED.compliant,
              updated_at = EXCLUDED.updated_at
        SQL
      end
    end
    
    # We'll drop the old table in a separate migration after confirming everything works
    # For now, both tables can coexist
  end
  
  def down
    drop_table :invalid_emails if table_exists?(:invalid_emails)
  end
end