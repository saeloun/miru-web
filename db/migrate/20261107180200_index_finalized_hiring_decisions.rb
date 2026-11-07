# frozen_string_literal: true

class IndexFinalizedHiringDecisions < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :hiring_decisions, [:company_id, :finalized_at, :id], where: "state = 'finalized'",
      name: "index_hiring_decisions_finalized", algorithm: :concurrently
  end
end
