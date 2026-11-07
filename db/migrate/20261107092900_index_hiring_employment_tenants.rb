# frozen_string_literal: true

class IndexHiringEmploymentTenants < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :employments, [:company_id, :id], unique: true, algorithm: :concurrently,
      name: "index_employments_hiring_tenant_identity", if_not_exists: true
  end
end
