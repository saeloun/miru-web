# frozen_string_literal: true

class PopulateEmploymentsForCurrentWorkspaceUsersVerifier
  def self.verify!
    error_users = []
    User.where.not(current_workspace_id: nil).find_each do |user|
      error_users << user.id unless user.employments.exists?(company_id: user.current_workspace_id)
    end
    raise "Employments are not populated for users with ids: #{error_users.join(', ')}" if error_users.any?

    puts "PopulateEmploymentsForCurrentWorkspaceUsersVerifier data migration verified successfully!"
  end
end
