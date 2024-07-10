# frozen_string_literal: true

class ValidateForeignKeyOnRecurringExecutions < ActiveRecord::Migration[7.1]
  def change
    validate_foreign_key :solid_queue_recurring_executions, :solid_queue_jobs
  end
end
