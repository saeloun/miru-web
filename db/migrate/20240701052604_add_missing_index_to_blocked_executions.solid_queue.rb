# frozen_string_literal: true

# This migration comes from solid_queue (originally 20240110143450)
class AddMissingIndexToBlockedExecutions < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_index :solid_queue_blocked_executions, [ :concurrency_key, :priority, :job_id ],
      name: "index_solid_queue_blocked_executions_for_release", algorithm: :concurrently
  end
end
