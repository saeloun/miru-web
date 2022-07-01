# frozen_string_literal: true

class CreateInvitedUser
  attr_reader :token
  attr_accessor :success, :error, :error_message, :user, :reset_password_token

  def initialize(token)
    @token = token
    @success = true
    @error_message = nil
    @user = nil
    @reset_password_token = nil
  end

  def process
    if invitation_valid?
      ActiveRecord::Base.transaction do
        update_invitation!
        create_invited_user!
        add_role_to_invited_user
        create_reset_password_token
      end
    else
      service_failed("Invitation expired")
    end
  rescue StandardError => e
    service_failed(e.message)
    Rails.logger.error e.message
    Rails.logger.error e.backtrace.join("\n")
  end

  private

    def invitation
      @_invitation ||= Invitation.find_by!(token:)
    end

    def invitation_valid?
      invitation.is_valid?
    end

    def update_invitation!
      invitation.update!(accepted_at: Time.current)
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

    def create_reset_password_token
      @reset_password_token = user.create_reset_password_token
    end

    def service_failed(message)
      @success = false
      @error_message = message
    end
end
