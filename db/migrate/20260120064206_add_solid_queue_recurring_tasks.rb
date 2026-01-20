# frozen_string_literal: true

class AddSolidQueueRecurringTasks < ActiveRecord::Migration[7.2]
  def change
    # Add name column to solid_queue_processes (required for SolidQueue 1.x)
    # Step 1: Add nullable column without default
    add_column :solid_queue_processes, :name, :string, null: true

    # Step 2: Backfill existing rows with unique values
    reversible do |dir|
      dir.up do
        execute <<-SQL.squish
          UPDATE solid_queue_processes
          SET name = 'process_' || id::text
          WHERE name IS NULL
        SQL
      end
    end

    # Step 3: Add NOT NULL constraint and default
    change_column_null :solid_queue_processes, :name, false
    change_column_default :solid_queue_processes, :name, ""

    # Step 4: Add unique index
    add_index :solid_queue_processes, [:name, :supervisor_id], unique: true, name: "index_solid_queue_processes_on_name_and_supervisor_id"

    # Create solid_queue_recurring_tasks table (required for SolidQueue 1.x)
    create_table :solid_queue_recurring_tasks do |t|
      t.string :key, null: false
      t.string :schedule, null: false
      t.string :command, limit: 2048
      t.string :class_name
      t.text :arguments
      t.string :queue_name
      t.integer :priority, default: 0
      t.boolean :static, default: true, null: false
      t.text :description
      t.timestamps
    end

    add_index :solid_queue_recurring_tasks, :key, unique: true
    add_index :solid_queue_recurring_tasks, :static
  end
end
