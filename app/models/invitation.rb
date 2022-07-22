# frozen_string_literal: true

# == Schema Information
#
# Table name: invitations
#
#  id              :bigint           not null, primary key
#  accepted_at     :datetime
#  expired_at      :datetime
#  first_name      :string
#  last_name       :string
#  recipient_email :string           not null
#  role            :integer          default("owner"), not null
#  token           :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  sender_id       :bigint           not null
#
# Indexes
#
#  index_invitations_on_company_id  (company_id)
#  index_invitations_on_sender_id   (sender_id)
#  index_invitations_on_token       (token) UNIQUE
#
class Invitation < ApplicationRecord
  enum role: [:owner, :admin, :employee, :book_keeper]

  # Constant
  MAX_EXPIRATION_DAY = 14.days

  # Associations
  belongs_to :company
  belongs_to :sender, class_name: "User"

  # Validations
  validates :recipient_email, :role, :token, :expired_at, presence: true
  validates :recipient_email, format: { with: Devise.email_regexp }
  validates_uniqueness_of :token
  validates_uniqueness_of :recipient_email, on: :create, if: -> { user_invitation_present? }
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }
  validate :non_existing_company_user
  validate :recipient_email_not_changed

  # Scopes
  scope :valid_invitations, -> {
    where(accepted_at: nil, expired_at: Time.current...(Time.current + MAX_EXPIRATION_DAY))
  }

  # Callbacks
  before_validation :set_token, on: :create
  before_validation :set_expired_at, on: :create
  after_create_commit :send_invitation_mail

  def full_name
    "#{first_name} #{last_name}"
  end

  def is_valid?
    (expired_at >= Time.current) && accepted_at.nil?
  end

  def user_invitation_present?
    Invitation.where(company_id: company.id, recipient_email:).valid_invitations.any?
  end

  def set_token
    loop do
      self.token = Devise.friendly_token
      break unless Invitation.exists?(token: self.token)
    end
  end

  private

    def set_expired_at
      self.expired_at = Time.current + MAX_EXPIRATION_DAY
    end

    def non_existing_company_user
      if company && employment_in_company_present?
        self.errors.add(:base, "User is already a team member in workspace")
      end
    end

    def employment_in_company_present?
      company.employments.kept.includes(:user).find_by(user: { email: recipient_email }).present?
    end

    def recipient_email_not_changed
      if recipient_email_changed? && self.persisted?
        self.errors.add(:recipient_email, "updation is not allowed")
      end
    end

    def send_invitation_mail
      user_already_exists = User.exists?(email: recipient_email)
      UserInvitationMailer.with(
        recipient: recipient_email,
        token:,
        user_already_exists:,
        name: full_name
      ).send_user_invitation.deliver_later
    end
end
