# frozen_string_literal: true

class Employment < ApplicationRecord
  include Discardable

  # Associations
  belongs_to :company
  belongs_to :user

  # Validations
  validates :designation, :employment_type, :joined_at, :employee_id, presence: true, on: :update
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
  validates :joined_at, comparison: { less_than_or_equal_to: -> { Date.current }, message: "date must be in past" },
    on: :update
  # Callbacks
  before_destroy :remove_user_invitations

  after_discard do
    notification_preference = NotificationPreference.find_by(user:, company:)
    notification_preference&.unsubscribe_all! unless notification_preference&.unsubscribed_from_all?

    next_employment = user.employments.kept.first

    if next_employment.present?
      user.current_workspace = next_employment.company
      user.save!
    end
  end

  after_undiscard do
    NotificationPreference.find_by(user:, company:)&.resubscribe!
  end

  def formatted_joined_at
    CompanyDateFormattingService.new(joined_at, company:).process
  end

  def formatted_resigned_at
    CompanyDateFormattingService.new(resigned_at, company:).process
  end

  private

    def remove_user_invitations
      company.invitations.where(recipient_email: user.email).destroy_all
    end
end
