# frozen_string_literal: true

class InternalApi::V1::AddressesController < InternalApi::V1::ApplicationController
  include AddressableConcern

  before_action :set_addressable_type, :set_addressable

  def index
    authorize @addressable, policy_class: AddressPolicy
    addresses = @addressable.addresses
    render :index, locals: { addresses: }, status: :ok
 end

  def create
    authorize @addressable, policy_class: AddressPolicy
    address = @addressable.addresses.new(
      address_params.merge(
        addressable_type: @addressable_type,
        addressable_id: @addressable.id))
    address.save!
    render :create, locals: { address: }, status: :ok
 end

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

    def set_addressable_type
      @addressable_type ||= params[:addressable_type]
    end

    def set_addressable
      if @addressable_type == "User"
        @addressable = User.find(params[:user_id])
      else
        @addressable = Company.find(params[:company_id])
      end
    end

    def address
      @address ||= Address.find(params[:id])
    end

    def address_params
      params.require(:address).permit(
        :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin
      )
    end
end
