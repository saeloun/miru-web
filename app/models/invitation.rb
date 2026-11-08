# frozen_string_literal: true

class Invitation < ApplicationRecord
  include Searchable
  audited associated_with: :company, except: [:updated_at, :token]
  enum :role, [:owner, :admin, :employee, :book_keeper, :client]

  pg_search_scope :pg_search,
    against: [:first_name, :last_name, :recipient_email],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "english"
      }
    }

  # Constant
  MAX_EXPIRATION_DAY = 14.days

  # Associations
  belongs_to :company
  belongs_to :client, optional: true
  belongs_to :sender, class_name: "User"
  belongs_to :hiring_offer, optional: true

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
  validate :valid_hiring_offer
  # Scopes
  scope :valid_invitations, -> {
    where(accepted_at: nil, expired_at: Time.current...(Time.current + MAX_EXPIRATION_DAY))
  }

  # Callbacks
  before_validation :set_token, on: :create
  before_validation :set_expired_at, on: :create
  after_create_commit :send_invitation_mail
  after_create { Rails.event.notify(Invitations::Sent.new(self)) }
  after_update(if: -> { saved_change_to_accepted_at?(from: nil) }) { Rails.event.notify(Invitations::Accepted.new(self)) }

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

    def valid_hiring_offer
      if hiring_offer && (hiring_offer.company_id != company_id || !hiring_offer.onboarding_started_at || !employee? || client_id)
        errors.add(:base, "Use the employee invitation for this workspace's approved hiring onboarding")
      end
      if persisted? && hiring_offer_id_in_database && will_save_change_to_hiring_offer_id?
        errors.add(:hiring_offer, "cannot be reassigned")
      end
      if hiring_offer && hiring_offer.onboarding_details["intent"]&.slice("first_name", "last_name") != attributes.slice("first_name", "last_name")
        errors.add(:base, "Names are fixed by confirmed onboarding; edit the member's profile after acceptance")
      end
    end

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
        employee_count: [company.used_team_seats, 1].max
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
