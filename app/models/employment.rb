# frozen_string_literal: true

class Employment < ApplicationRecord
  include Discardable

  STAFF_ROLES = %w[owner admin manager employee book_keeper].freeze
  EMPLOYEE_ID_INDEX = "index_employments_on_company_employee_id"
  MAX_EMPLOYEE_NUMBER = 999_999_999_999_999_999 # SI plus 18 digits fits the editor's 20-character limit.

  # Associations
  belongs_to :company
  belongs_to :user
  has_many :salary_slips, dependent: :destroy
  has_many :tax_declarations, dependent: :destroy
  has_many :consultant_compensations, dependent: :destroy
  has_one :employee_record, dependent: :destroy
  has_many :employee_documents, dependent: :destroy
  has_many :employee_payments, dependent: :destroy
  has_many :employee_occasion_deliveries, dependent: :destroy

  # Validations
  validates :designation, :employment_type, :joined_at, :employee_id, presence: true, on: :update
  validates :employee_id, uniqueness: { scope: :company_id }, unless: -> { employee_id.blank? }
  validate :employee_number_within_range, if: :will_save_change_to_employee_id?
  validates :resigned_at, comparison: { greater_than: :joined_at }, unless: -> { resigned_at.nil? }
  validates :joined_at, comparison: { less_than_or_equal_to: -> { Date.current }, message: "date must be in past" },
    on: :update
  # Callbacks
  before_destroy :remove_user_invitations
  around_save :reserve_employee_number, if: -> { will_save_change_to_employee_id? && employee_id.present? }
  around_destroy :reserve_employee_number
  after_create :ensure_employee_id!

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

  def ensure_employee_id!
    company.with_employee_number_lock do |locked_company|
      persisted = self.class.lock.find(id)
      if persisted.employee_id.blank? && persisted.kept? &&
          persisted.user.roles.where(resource: locked_company, name: STAFF_ROLES).exists?
        number = locked_company.reserve_employee_number!
        if number >= MAX_EMPLOYEE_NUMBER
          errors.add(:employee_id, "has exhausted the supported range")
          raise ActiveRecord::RecordInvalid.new(self)
        end
        generated_id = "SI#{(number + 1).to_s.rjust(3, '0')}"
        persisted.update_columns(employee_id: generated_id)
        locked_company.update_columns(last_employee_number: number + 1)
        persisted.employee_id = generated_id
      end
      self.employee_id = persisted.employee_id
      clear_attribute_change(:employee_id)
    end
    employee_id
  end

  def update_profile!(attributes)
    company.with_employee_number_lock do
      lock!
      update!(attributes)
    end
  rescue ActiveRecord::RecordNotUnique => exception
    raise unless self.class.employee_id_conflict?(exception)

    errors.add(:employee_id, :taken)
    raise ActiveRecord::RecordInvalid.new(self)
  end

  def self.employee_id_conflict?(exception)
    exception.cause.is_a?(PG::UniqueViolation) &&
      exception.cause.result.error_field(PG::Result::PG_DIAG_CONSTRAINT_NAME) == EMPLOYEE_ID_INDEX
  end

  private

    def employee_number_within_range
      return unless employee_id.to_s.match?(/\ASI[0-9]+\z/)
      return if employee_id.delete_prefix("SI").to_i <= MAX_EMPLOYEE_NUMBER

      errors.add(:employee_id, "is outside the supported range")
    end

    def reserve_employee_number
      company.with_employee_number_lock do |locked_company|
        locked_company.reserve_employee_number!
        yield
        locked_company.reserve_employee_number!
      end
    end

    def remove_user_invitations
      company.invitations.where(recipient_email: user.email).destroy_all
    end
end
