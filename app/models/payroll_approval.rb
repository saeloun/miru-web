# frozen_string_literal: true

class PayrollApproval < ApplicationRecord
  belongs_to :payroll_revision
  belongs_to :actor, class_name: "User"

  validates :stage, inclusion: { in: %w[accounts final] }, uniqueness: { scope: :payroll_revision_id }
  validate :approval_is_permitted, on: :create

  def readonly?
    persisted?
  end

  private

    def approval_is_permitted
      return unless payroll_revision

      run = payroll_revision.payroll_run
      expected_actor = stage == "final" ? run.final_reviewer_id : run.accounts_reviewer_id
      errors.add(:actor, "is not the assigned eligible reviewer") unless actor_id == expected_actor && run.eligible_actor?(actor, stage)
      errors.add(:actor, "must review in the run workspace") unless User.kept.exists?(id: actor_id, current_workspace_id: run.company_id)
      errors.add(:payroll_revision, "is not current") unless run.current_revision&.id == payroll_revision.id
      errors.add(:payroll_revision, "has unresolved review issues") if payroll_revision.approval_issues.any?
      return unless stage == "final"

      accounts = payroll_revision.payroll_approvals.find_by(stage: "accounts")
      unless accounts && accounts.actor_id != actor_id && run.eligible_actor?(accounts.actor, "accounts")
        errors.add(:stage, "requires a current eligible accounts approval")
      end
    end
end
