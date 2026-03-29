# frozen_string_literal: true

class Employment < ApplicationRecord
  include Discard::Model

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
    if user.employments.kept.count >= 1
      user.current_workspace = user.employments.kept.first.company
      user.save!
    end
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
