# frozen_string_literal: true

class InternalApi::V1::AddressesController < InternalApi::V1::ApplicationController
  def show
    authorize address
    render :show, locals: { address: }, status: :ok
  end

  def update
    authorize address
    address.update!(address_params)
    render :update, locals: { address: }, status: :ok
  end

  private

    def address
      @address ||= Address.find(params[:id])
    end

    def address_params
      params.require(:address).permit(
        :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin
      )
    end
end
