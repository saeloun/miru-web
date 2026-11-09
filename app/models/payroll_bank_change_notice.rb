# frozen_string_literal: true

class PayrollBankChangeNotice < ApplicationRecord
  belongs_to :company
  belongs_to :employment
  belongs_to :recipient, class_name: "User"
  attr_readonly :company_id, :employment_id, :recipient_id, :event_id
  after_create_commit :enqueue_delivery

  def self.capture!(employment)
    return unless Payroll::Entitlement.enabled?(employment.company_id) && employment.kept? && !employment.user.discarded?
    return unless employment.consultant_compensations.where(effective_on: ..employment.company.resolved_time_zone.today).exists?

    event_id = SecureRandom.uuid
    recipients(employment.company).find_each do |recipient|
      create!(company: employment.company, employment:, recipient:, event_id:)
    end
  end

  def self.recipients(company)
    today = company.resolved_time_zone.today
    members = company.employments.kept.where(joined_at: ..today)
      .where("resigned_at IS NULL OR resigned_at >= ?", today).select(:user_id)
    roles = Role.where(resource: company)
    owners = roles.where(name: "owner").select(:id)
    reviewers = roles.where(name: %w[owner admin book_keeper]).select(:id)
    assigned = PayrollRun.where(company:).select(:accounts_reviewer_id)
    active = User.kept.where(id: members).joins(:roles)
    active.where(roles: { id: owners }).or(active.where(id: assigned, roles: { id: reviewers })).distinct
  end

  def recipient_eligible?
    employment.kept? && !employment.user.discarded? && self.class.recipients(company).exists?(id: recipient_id)
  end

  def enqueue_delivery
    PayrollBankChangeNoticeJob.perform_later(id) if state == "queued"
  rescue StandardError
    # The committed profile and queued journal remain authoritative if the queue is unavailable.
    Rails.logger.warn("Payroll bank-change notice enqueue requires recovery")
  end
end
