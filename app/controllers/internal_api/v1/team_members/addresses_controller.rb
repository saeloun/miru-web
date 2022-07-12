# frozen_string_literal: true

class InternalApi::V1::TeamMembers::AddressesController < InternalApi::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::AddressPolicy
    render :show, locals: { user: employment.user }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamMembers::AddressPolicy
    user = employment.user
    address = user.addresses.find_by(address_type: address_params[:address_type])
    address.update!(address_params)
    render json: {
      address:,
      notice: ("Address updated successfully.")
    }, status: :ok
  end

  private

    def employment
      @employment ||= Employment.find(params[:team_id])
    end

    def address_params
      params.require(:address).permit(
        :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin
      )
    end
end
