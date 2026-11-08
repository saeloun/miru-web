# frozen_string_literal: true

class IndexHiringTaskRevisionsForTenant < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :hiring_assignment_template_revisions, [:company_id, :id], unique: true,
      name: "index_hiring_task_revisions_for_tenant", algorithm: :concurrently
  end
end
