# frozen_string_literal: true

module Authentication
  class Google
    PROVIDER = "google_oauth2"

    def initialize(user_data)
      @user_data = user_data
    end

    def user!
      return if @user_data.blank? || google_id.blank?

      Identity.google_auth.where(uid: google_id)&.first&.user || create_user!
    end

    private

      def create_user!
        user = User.find_by_email(email)
        if user.present?
          user.identities.find_or_create_by(provider: PROVIDER, uid: google_id)
        else
          user_first_name = first_name || email.split("@").first
          user = User.new(
            email:,
            first_name: user_first_name,
            last_name:,
            password: Devise.friendly_token[0, 20]
          )
          user.skip_confirmation!
          user.save
          user.identities.create(provider: PROVIDER, uid: google_id)
        end
        user
      end

      def email
        @user_data.info.email
      end

      def first_name
        @user_data.info.first_name
      end

      def last_name
        @user_data.info.last_name
      end

      def google_id
        @user_data.uid
      end
  end
end
