# frozen_string_literal: true

class Api::V1::AddressesController < Api::V1::ApplicationController
  before_action :set_addressable

  def index
    authorize @addressable, policy_class: AddressPolicy
    addresses = @addressable.addresses
    render :index, locals: { addresses: }, status: 200
 end

  def create
    authorize @addressable, policy_class: AddressPolicy
    address = @addressable.addresses.create!(address_params)
    render :create, locals: { address: }, status: 200
 end

  def show
    authorize address
    render :show, locals: { address: }, status: 200
  end

  def update
    authorize address
    address.update!(address_params)
    render :update, locals: { address: }, status: 200
  end

  private

    def set_addressable
      if params[:user_id]
        @addressable = User.find(params[:user_id])
      elsif params[:company_id]
        @addressable = Company.find(params[:company_id])
      end
    end

    def address
      @_address ||= Address.find(params[:id])
    end

    def address_params
      params.require(:address).permit(
        :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin
      )
    end
end
