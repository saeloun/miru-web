# typed: true

# DO NOT EDIT MANUALLY
# This file was pulled from a central RBI files repository.
# Please run `bin/tapioca annotations` to update it.

# @shim: Devise controllers are loaded by rails
class DeviseController
  # Gets the actual resource stored in the instance variable
  sig { returns(T.untyped) }
  def resource; end

  # Proxy to devise map name
  sig { returns(Symbol) }
  def resource_name; end

  sig { returns(Symbol) }
  def scope_name; end

  # Proxy to devise map class
  sig { returns(T::Class[T.anything]) }
  def resource_class; end

  # Returns a signed in resource from session (if one exists)
  sig { returns(T.untyped) }
  def signed_in_resource; end

  # Attempt to find the mapped route for devise based on request path
  sig { returns(T.untyped) }
  def devise_mapping; end

  # Returns real navigational formats which are supported by Rails
  sig { returns(T.untyped) }
  def navigational_formats; end

  sig { params(msg: String).returns(T.noreturn) }
  def unknown_action!(msg); end

  # Sets the resource creating an instance variable
  sig { params(new_resource: T.untyped).void }
  def resource=(new_resource); end

  # Helper for use in before_actions where no authentication is required.
  #
  # Example:
  #   before_action :require_no_authentication, only: :new
  sig { void }
  def require_no_authentication; end

  # Helper for use after calling send_*_instructions methods on a resource.
  # If we are in paranoid mode, we always act as if the resource was valid
  # and instructions were sent.
  sig { params(resource: T.untyped).returns(T.nilable(T::Boolean)) }
  def successfully_sent?(resource); end

  # Controllers inheriting DeviseController are advised to override this
  # method so that other controllers inheriting from them would use
  # existing translations.
  sig { returns(String) }
  def translation_scope; end

  sig { returns(ActionController::Parameters) }
  def resource_params; end
end

# @shim: Devise controllers are loaded by rails
class Devise::ConfirmationsController < DeviseController
  # GET /resource/confirmation/new
  sig { returns(T.untyped) }
  def new; end

  # POST /resource/confirmation
  sig { returns(T.untyped) }
  def create; end

  # GET /resource/confirmation?confirmation_token=abcdef
  sig { returns(T.untyped) }
  def show; end

  # The path used after resending confirmation instructions.
  sig { params(resource_name: Symbol).returns(String) }
  def after_resending_confirmation_instructions_path_for(resource_name); end

  # The path used after confirmation.
  sig { params(resource_name: Symbol, resource: T.untyped).returns(String) }
  def after_confirmation_path_for(resource_name, resource); end
end

# @shim: Devise controllers are loaded by rails
class Devise::OmniauthCallbacksController < DeviseController
  sig { returns(T.untyped) }
  def passthru; end

  sig { returns(T.untyped) }
  def failure; end

  sig { returns(String) }
  def failed_strategy; end

  sig { returns(String) }
  def failure_message; end

  sig { params(scope: String).returns(String) }
  def after_omniauth_failure_path_for(scope); end
end

# @shim: Devise controllers are loaded by rails
class Devise::PasswordsController < DeviseController
  # GET /resource/password/new
  sig { returns(T.untyped) }
  def new; end

  # POST /resource/password
  sig { returns(T.untyped) }
  def create; end

  # GET /resource/password/edit?reset_password_token=abcdef
  sig { returns(T.untyped) }
  def edit; end

  # PUT /resource/password
  sig { returns(T.untyped) }
  def update; end

  sig { params(resource: T.untyped).returns(String) }
  def after_resetting_password_path_for(resource); end

  # The path used after sending reset password instructions
  sig { params(resource_name: Symbol).returns(T.nilable(String)) }
  def after_sending_reset_password_instructions_path_for(resource_name); end

  # Check if a reset_password_token is provided in the request
  sig { void }
  def assert_reset_token_passed; end

  # Check if proper Lockable module methods are present & unlock strategy
  # allows to unlock resource on password reset
  sig { params(resource: T.untyped).returns(T::Boolean) }
  def unlockable?(resource); end
end

# @shim: Devise controllers are loaded by rails
class Devise::RegistrationsController < DeviseController
  # GET /resource/sign_up
  sig { returns(T.untyped) }
  def new; end

  # POST /resource
  sig { returns(T.untyped) }
  def create; end

  # GET /resource/edit
  sig { returns(T.untyped) }
  def edit; end

  # PUT /resource
  # We need to use a copy of the resource because we don't want to change
  # the current user in place.
  sig { returns(T.untyped) }
  def update; end

  # DELETE /resource
  sig { returns(T.untyped) }
  def destroy; end

  # GET /resource/cancel
  # Forces the session data which is usually expired after sign
  # in to be expired now. This is useful if the user wants to
  # cancel oauth signing in/up in the middle of the process,
  # removing all OAuth session data.
  sig { returns(T.untyped) }
  def cancel; end

  sig { params(resource: T.untyped, previous: T.untyped).returns(T::Boolean) }
  def update_needs_confirmation?(resource, previous); end

  # By default we want to require a password checks on update.
  # You can overwrite this method in your own RegistrationsController.
  sig { params(resource: T.untyped, params: ActionController::Parameters).void }
  def update_resource(resource, params); end

  # Build a devise resource passing in the session. Useful to move
  # temporary session data to the newly created user.
  sig { params(hash: T.untyped).returns(T.untyped) }
  def build_resource(hash = {}); end

  # Signs in a user on sign up. You can overwrite this method in your own
  # RegistrationsController.
  sig { params(resource_name: Symbol, resource: T.untyped).void }
  def sign_up(resource_name, resource); end

  # The path used after sign up. You need to overwrite this method
  # in your own RegistrationsController.
  sig { params(resource: T.untyped).returns(T.nilable(String)) }
  def after_sign_up_path_for(resource); end

  # The path used after sign up for inactive accounts. You need to overwrite
  # this method in your own RegistrationsController.
  sig { params(resource: T.untyped).returns(String) }
  def after_inactive_sign_up_path_for(resource); end

  # The default url to be used after updating a resource. You need to overwrite
  # this method in your own RegistrationsController.
  sig { params(resource: T.untyped).returns(String) }
  def after_update_path_for(resource); end

  # Authenticates the current scope and gets the current resource from the session.
  sig { void }
  def authenticate_scope!; end

  sig { returns(ActionController::Parameters) }
  def sign_up_params; end

  sig { returns(ActionController::Parameters) }
  def account_update_params; end
end

# @shim: Devise controllers are loaded by rails
class Devise::SessionsController < DeviseController
  # GET /resource/sign_in
  sig { returns(T.untyped) }
  def new; end

  # POST /resource/sign_in
  sig { returns(T.untyped) }
  def create; end

  # DELETE /resource/sign_out
  sig { returns(T.untyped) }
  def destroy; end

  sig { returns(ActionController::Parameters) }
  def sign_in_params; end

  sig { params(resource: T.untyped).returns(T::Hash[Symbol, T.untyped]) }
  def serialize_options(resource); end

  sig { returns(T::Hash[Symbol, T.untyped]) }
  def auth_options; end
end

# @shim: Devise controllers are loaded by rails
class Devise::UnlocksController < DeviseController
  # GET /resource/unlock/new
  sig { returns(T.untyped) }
  def new; end

  # POST /resource/unlock
  sig { returns(T.untyped) }
  def create; end

  # GET /resource/unlock?unlock_token=abcdef
  sig { returns(T.untyped) }
  def show; end

  # The path used after sending unlock password instructions
  sig { params(resource: T.untyped).returns(T.nilable(String)) }
  def after_sending_unlock_instructions_path_for(resource); end

  # The path used after unlocking the resource
  sig { params(resource: T.untyped).returns(T.nilable(String)) }
  def after_unlock_path_for(resource); end
end

module Devise
  sig { params(block: T.proc.params(config: T.class_of(::Devise)).void).void }
  def self.setup(&block); end

  module Models
    module Authenticatable
      sig { returns(T::Boolean) }
      def active_for_authentication?; end
    end

    module Confirmable
      sig { returns(T::Boolean) }
      def confirmed?; end

      sig { returns(T::Boolean) }
      def pending_reconfirmation?; end

      sig { void }
      def send_confirmation_instructions; end

      sig { void }
      def resend_confirmation_instructions; end

      sig { returns(T::Boolean) }
      def active_for_authentication?; end

      sig { void }
      def skip_confirmation!; end

      sig { void }
      def skip_confirmation_notification!; end

      sig { void }
      def skip_reconfirmation!; end
    end

    module DatabaseAuthenticatable
      sig { void }
      def skip_email_changed_notification!; end

      sig { void }
      def skip_password_change_notification!; end

      sig { void }
      def after_database_authentication; end

      sig { void }
      def send_email_changed_notification; end

      sig { void }
      def send_password_change_notification; end
    end

    module Lockable
      sig { params(opts: T::Hash[Symbol, T.untyped]).void }
      def lock_access!(opts = {}); end

      sig { void }
      def unlock_access!; end

      sig { void }
      def reset_failed_attempts!; end

      sig { returns(T::Boolean) }
      def access_locked?; end

      sig { void }
      def send_unlock_instructions; end

      sig { void }
      def resend_unlock_instructions; end

      sig { returns(T::Boolean) }
      def active_for_authentication?; end

      sig { returns(T::Boolean) }
      def valid_for_authentication?; end
    end

    module Recoverable
      sig { void }
      def send_reset_password_instructions; end

      sig { returns(T::Boolean) }
      def reset_password_period_valid?; end
    end

    module Rememberable
      sig { void }
      def remember_me!; end

      sig { void }
      def forget_me!; end

      sig { void }
      def after_remembered; end
    end

    module Timeoutable
      sig { params(last_access: T.untyped).returns(T::Boolean) }
      def timedout?(last_access); end
    end
  end
end
