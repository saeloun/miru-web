# frozen_string_literal: true

class CreateInvitedUserService
  attr_reader :token, :current_user
  attr_accessor :success, :error, :error_message, :user, :reset_password_token, :new_user

  class InvitationExpired < StandardError
    def message
      "Invitation expired"
    end
  end

  class InvalidInvitaion < StandardError
    def message
      I18n.t("devise.failure.already_authenticated")
    end
  end

  def initialize(token, current_user = nil)
    @token = token
    @success = true
    @error_message = nil
    @current_user = current_user
    @user = nil
    @reset_password_token = nil
    @new_user = false
  end

  def process
    invitation_valid!
    user_valid!
    ActiveRecord::Base.transaction do
      update_invitation!
      find_or_create_user!
      add_role_to_invited_user
      create_client_member
      create_notification_preference
      create_email_rate_limiter
    end
  rescue StandardError => e
    service_failed(e.message)
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")
  end

  private

    def invitation
      @_invitation ||= find_invitation
    end

    def find_invitation
      Invitation.find_by(token: @token) || raise(InvitationExpired)
    end

    def invitation_valid!
      raise InvitationExpired unless invitation.is_valid?
    end

    def user_valid!
      if !(current_user.nil? || current_user.email == invitation.recipient_email)
        raise InvalidInvitaion
      end
    end

    def update_invitation!
      invitation.update!(accepted_at: Time.current)
    end

    def find_or_create_user!
      if (@user = User.find_by(email: invitation.recipient_email))
        @user.update!(current_workspace_id: invitation.company.id)
        activate_employment_status unless invitation.client
      else
        create_invited_user!
        create_reset_password_token
        @new_user = true
      end
    end

    def activate_employment_status
      @employment = Employment.find_by(user: @user, company: invitation.company)
      if @employment.present? && @employment.discarded?
        @employment.undiscard!
      end
    end

    def create_invited_user!
      @user = User.new(
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        email: invitation.recipient_email,
        confirmed_at: Time.current,
        current_workspace_id: invitation.company.id
      )
      @user.skip_password_validation = true
      @user.save!
    end

    def add_role_to_invited_user
      user.current_company = invitation.company
      user.role = invitation.role
      user.assign_company_and_role
    end

    def create_client_member
      return unless invitation.client

      invitation.company.client_members.create!(client: invitation.client, user:)
    end

    def create_notification_preference
      NotificationPreference.find_or_create_by(
        user_id: user.id,
        company_id: invitation.company.id)
    end

    def create_email_rate_limiter
      user.create_email_rate_limiter!
    end

    def create_reset_password_token
      @reset_password_token = user.create_reset_password_token
    end

    def service_failed(message)
      @success = false
      @error_message = message
    end
end
