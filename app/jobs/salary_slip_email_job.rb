# frozen_string_literal: true

class SalarySlipEmailJob < ApplicationJob
  def perform(slip_id, actor_id, company_id, expected_email)
    slip = SalarySlip.find_by(id: slip_id)
    return unless slip && slip.employment.company_id == company_id

    slip.employment.with_lock do
      slip.reload
      actor = User.kept.find_by(id: actor_id)
      actor.current_workspace_id = company_id if actor
      next unless actor && SalarySlipPolicy.new(actor, slip).email? && slip.status == "published" &&
        expected_email.present? && slip.email_recipient == expected_email
      next if slip.audits.where(action: "email", created_at: 5.minutes.ago..).exists?

      SalarySlipMailer.with(slip:, recipient: expected_email).published.deliver_now
      slip.audits.create!(action: "email", user: actor, associated: slip.company,
        audited_changes: { "recipient_user_id" => slip.employment.user_id })
    end
  end
end
