# frozen_string_literal: true

module NativeGoogleAuth
  class Account
    class Rejected < StandardError
      attr_reader :code

      def initialize(code)
        @code = code
        super(code)
      end
    end

    def initialize(auth, request_record)
      @auth = auth
      @request_record = request_record
    end

    def resolve!
      validate_identity!
      User.transaction do
        lock_subject!
        authorize_user!(resolve_user!)
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      raise Rejected, "signup_unavailable"
    end

    def self.requires_factor?(user)
      user.otp_required_for_login? || user.passkey_required_for_login?
    end

    private

      attr_reader :auth, :request_record

      def validate_identity!
        raise Rejected, "invalid_identity" unless auth&.provider == "google_oauth2" &&
          auth.uid.is_a?(String) && auth.uid.present? && auth.info&.email_verified == true &&
          auth.info.email.is_a?(String) && Devise.email_regexp.match?(auth.info.email)
      end

      def resolve_user!
        users = Identity.google_auth.where(uid: auth.uid).includes(:user).map(&:user).uniq(&:id)
        raise Rejected, "identity_conflict" if users.length > 1

        user = users.first || User.find_by(email: auth.info.email.downcase)
        if user
          user.lock!
          raise Rejected, "account_unavailable" unless user.confirmed? && user.active_for_authentication?
          raise Rejected, "identity_conflict" unless user.email.casecmp?(auth.info.email)
          raise Rejected, "identity_conflict" if user.identities.google_auth.where.not(uid: auth.uid).exists?

          user
        else
          raise Rejected, "signup_required" unless request_record.intent == "signup"

          create_user!
        end
      end

      def authorize_user!(user)
        raise Rejected, "sso_not_allowed" if SsoEnforcement.new(user).oauth_error
        if requires_factor?(user)
          [user, nil, "additional_verification_required"]
        else
          accept_invitation!(user)
          raise Rejected, "sso_not_allowed" if SsoEnforcement.new(user).oauth_error

          user.identities.find_or_create_by!(provider: "google_oauth2", uid: auth.uid)
          if user.companies.empty?
            [user, nil, "needs_workspace"]
          else
            company = user.companies.merge(Employment.kept).find_by(id: user.current_workspace_id)
            raise Rejected, "workspace_unavailable" unless company && user.roles.exists?(resource: company)

            [user, company, "signed_in"]
          end
        end
      end

      def requires_factor?(user)
        self.class.requires_factor?(user)
      end

      def lock_subject!
        number = Digest::SHA256.hexdigest("native-google:#{auth.uid}")[0, 15].to_i(16)
        User.connection.execute("SELECT pg_advisory_xact_lock(#{number})")
      end

      def create_user!
        user = User.new(email: auth.info.email.downcase, first_name: auth.info.first_name,
          last_name: auth.info.last_name, password: Devise.friendly_token(40))
        user.skip_confirmation!
        user.save!
        user
      end

      def accept_invitation!(user)
        invitation = request_record.invitation
        return unless invitation

        raise Rejected, "invitation_unavailable" unless invitation.is_valid? &&
          user.email.casecmp?(invitation.recipient_email)

        service = CreateInvitedUserService.new(invitation.token, user)
        service.process
        raise Rejected, "invitation_unavailable" unless service.success

        user.reload
      end
  end
end
