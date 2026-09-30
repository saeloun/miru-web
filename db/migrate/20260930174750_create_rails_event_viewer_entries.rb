# frozen_string_literal: true

class CreateRailsEventViewerEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :rails_event_viewer_entries do |t|
      t.string :name, null: false

      json_type = postgresql? ? :jsonb : :json
      t.column :payload, json_type, default: {}
      t.column :tags, json_type, default: {}
      t.column :context, json_type, default: {}

      t.string :source_file
      t.integer :source_line
      t.string :source_label
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :rails_event_viewer_entries, :name
    add_index :rails_event_viewer_entries, :occurred_at
    add_index :rails_event_viewer_entries, [:name, :occurred_at]

    if postgresql?
      add_index :rails_event_viewer_entries, :tags, using: :gin
      add_index :rails_event_viewer_entries, :context, using: :gin
    end
  end

  private

    def postgresql?
      connection.adapter_name.downcase.include?("postgresql")
    end
end
