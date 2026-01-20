# frozen_string_literal: true

# == Schema Information
#
# Table name: invitations
#
#  id               :bigint           not null, primary key
#  accepted_at      :datetime
#  expired_at       :datetime
#  first_name       :string
#  last_name        :string
#  recipient_email  :string           not null
#  role             :integer          default("owner"), not null
#  token            :string           not null
#  virtual_verified :boolean          default(FALSE)
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  client_id        :bigint
#  company_id       :bigint           not null
#  sender_id        :bigint           not null
#
# Indexes
#
#  index_invitations_on_accepted_at      (accepted_at)
#  index_invitations_on_client_id        (client_id)
#  index_invitations_on_company_id       (company_id)
#  index_invitations_on_expired_at       (expired_at)
#  index_invitations_on_recipient_email  (recipient_email)
#  index_invitations_on_role             (role)
#  index_invitations_on_sender_id        (sender_id)
#  index_invitations_on_token            (token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (client_id => clients.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (sender_id => users.id)
#
class Invitation < ApplicationRecord
  enum :role, { owner: 0, admin: 1, employee: 2, book_keeper: 3, client: 4 }

  # Constant
  MAX_EXPIRATION_DAY = 14.days

  # Associations
  belongs_to :company
  belongs_to :client, optional: true
  belongs_to :sender, class_name: "User"

  # Validations
  validates :recipient_email, :role, :token, presence: true
  validates :recipient_email, format: { with: Devise.email_regexp }
  validates_uniqueness_of :token
  validates_uniqueness_of :recipient_email, on: :create, if: -> { user_invitation_present? }
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 20 }
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

  searchkick filterable: [:first_name, :last_name, :recipient_email],
    word_middle: [:first_name, :last_name, :recipient_email]

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

  def resend_invitation
    send_invitation_mail
  end

  private

    def set_expired_at
      self.expired_at = Time.current + MAX_EXPIRATION_DAY
    end

    def non_existing_company_user
      if company && employment_in_company_present?
        self.errors.add(:base, t("errors.user_already_member"))
      end
    end

    def employment_in_company_present?
      company.employments.kept.includes(:user).find_by(user: { email: recipient_email }).present?
    end

    def recipient_email_not_changed
      if recipient_email_changed? && self.persisted?
        self.errors.add(:recipient_email, t("errors.updation_not_allowed"))
      end
    end

    def send_invitation_mail
      user_already_exists = User.exists?(email: recipient_email)

      company_details = {
        name: company.name,
        logo: company.company_logo,
        employee_count: company.employees_without_client_role.count
      }

      sender_details = {
        email: sender.email,
        avatar: sender.avatar_url,
        name: sender.full_name
      }

      UserInvitationMailer.with(
        recipient: recipient_email,
        token:,
        user_already_exists:,
        name: full_name,
        company_details:,
        sender_details:
      ).send_user_invitation.deliver_later
    end
end
