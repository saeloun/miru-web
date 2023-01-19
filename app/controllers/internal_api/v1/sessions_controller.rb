# frozen_string_literal: true

class InternalApi::V1::SessionsController < Devise::SessionsController
  respond_to :json

  private

    def respond_with(user, _opts = {})
      if user.persisted?
        if user.has_role?(:owner) && user.companies.empty?
          render json: { notice: "Signed successfully", redirect_route: new_company_path }
        elsif user.has_role?(:book_keeper, current_company)
          render json: { notice: "Signed successfully", redirect_route: root_path + "payments" }
        else
          render json: { notice: "Signed successfully", redirect_route: root_path + "time-tracking" }
        end
      end
    end
end
