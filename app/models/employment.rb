# frozen_string_literal: true

# == Schema Information
#
# Table name: employments
#
#  id              :integer          not null, primary key
#  company_id      :integer          not null
#  user_id         :integer          not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  discarded_at    :datetime
#  employee_id     :string
#  designation     :string
#  employment_type :string
#  joined_at       :date
#  resigned_at     :date
#
# Indexes
#
#  index_employments_on_company_id    (company_id)
#  index_employments_on_discarded_at  (discarded_at)
#  index_employments_on_user_id       (user_id)
#

class Employment < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :company
  belongs_to :user

  # Validations
  validates :designation, :employment_type, :joined_at, :employee_id, presence: true, on: :update
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
  validates :joined_at, comparison: { less_than_or_equal_to: Date.current, message: "date must be in past" },
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
