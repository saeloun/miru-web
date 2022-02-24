# frozen_string_literal: true

class RenameCompanyIdToCurrentWorkspaceIdInUser < ActiveRecord::Migration[7.0]
  def change
    rename_column :users, :company_id, :current_workspace_id
  end
end
