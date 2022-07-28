# frozen_string_literal: true

require_relative "./verifiers/populate_employments_for_current_workspace_users_verifier.rb"

class PopulateEmploymentsForCurrentWorkspaceUsers < ActiveRecord::Migration[7.0]
  def up
    User.where.not(current_workspace_id: nil).each do |user|
      employment = user.employments.find_or_create_by!(company_id: user.current_workspace_id)
    end

    PopulateEmploymentsForCurrentWorkspaceUsersVerifier.verify!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
