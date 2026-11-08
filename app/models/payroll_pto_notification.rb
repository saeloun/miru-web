# frozen_string_literal: true

class PayrollPtoNotification < ApplicationRecord
  belongs_to :company
  belongs_to :employment
  belongs_to :recipient, class_name: "User"
  attr_readonly :company_id, :employment_id, :recipient_id, :kind, :source_digest

  def recipient_eligible?
    return false if recipient.discarded?

    today = company.resolved_time_zone.today
    if kind == "correction" && employment.user_id == recipient_id
      return !employment.discarded? && employment.joined_at && employment.joined_at <= today &&
        (employment.resigned_at.nil? || employment.resigned_at >= today)
    end
    recipient.roles.where(resource: company, name: %w[owner admin]).exists? &&
      recipient.employments.kept.where(company:, joined_at: ..today).where("resigned_at IS NULL OR resigned_at >= ?", today).exists?
  end
end
