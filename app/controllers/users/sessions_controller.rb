# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  skip_before_action :verify_authenticity_token

  def create
    respond_to do |format|
       format.json do
         user = User.find_by_email(params[:email])
         if user && user.valid_password?(params[:password])
           token = user.generate_jwt
           render json: token.to_json
         else
           render json: { errors: { "email or password" => ["is invalid"] } }, status: :unprocessable_entity
         end
       end
       format.html { super }
     end
  end

  def after_sign_in_path_for(user)
    if user.has_role?(:owner) && user.companies.empty?
      new_company_path
    elsif user.has_role?(:book_keeper, current_company)
      # TODO: redirect to root and handle role based conditional redirection in react router
      root_path + "payments"
    else
      root_path + "time-tracking"
    end
  end
end
