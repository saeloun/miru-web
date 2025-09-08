# frozen_string_literal: true

class CreateMetrics < ActiveRecord::Migration[8.0]
  def change
    create_table :metrics do |t|
      # Polymorphic association
      t.references :trackable, polymorphic: true, null: false, index: true

      # Metric identification
      t.string :metric_type, null: false # e.g., 'hours_logged', 'invoice_summary', 'project_stats'
      t.string :period, null: false # e.g., 'day', 'week', 'month', 'year', 'all_time'
      t.date :period_date # The specific date for this metric period

      # Aggregated data stored as JSONB for flexibility
      t.jsonb :data, null: false, default: {}

      # Common calculated values for fast access
      t.decimal :value_sum, precision: 20, scale: 2, default: 0
      t.integer :value_count, default: 0
      t.decimal :value_avg, precision: 20, scale: 2, default: 0
      t.decimal :value_min, precision: 20, scale: 2
      t.decimal :value_max, precision: 20, scale: 2

      # Metadata
      t.jsonb :metadata, default: {}
      t.datetime :calculated_at, null: false
      t.timestamps

      # Indexes for performance
      t.index [:trackable_type, :trackable_id, :metric_type, :period, :period_date],
              name: "index_metrics_on_trackable_and_type_and_period",
              unique: true
      t.index :metric_type
      t.index :period
      t.index :period_date
      t.index :data, using: :gin
      t.index :metadata, using: :gin
      t.index :calculated_at
    end

    # Add check constraint for valid periods
    safety_assured do
      execute <<-SQL
        ALTER TABLE metrics#{' '}
        ADD CONSTRAINT valid_period#{' '}
        CHECK (period IN ('hour', 'day', 'week', 'month', 'quarter', 'year', 'all_time'));
      SQL

      # Add check constraint for valid metric types
      execute <<-SQL
        ALTER TABLE metrics#{' '}
        ADD CONSTRAINT valid_metric_type#{' '}
        CHECK (metric_type IN (
          'hours_logged',#{' '}
          'invoice_summary',#{' '}
          'project_stats',
          'client_revenue',
          'team_utilization',
          'outstanding_amounts',
          'overdue_amounts',
          'timesheet_summary'
        ));
      SQL
    end
  end
end
