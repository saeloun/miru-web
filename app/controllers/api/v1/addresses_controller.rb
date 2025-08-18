# frozen_string_literal: true

class Api::V1::AddressesController < Api::V1::ApplicationController
  before_action :authenticate_user!
  before_action :set_addressable
  before_action :set_address, only: [:show, :update]
  after_action :verify_authorized

  def index
    authorize @addressable, :show?
    addresses = @addressable.addresses

    render json: { addresses: addresses.map { |address| serialize_address(address) } }
  end

  def create
    authorize @addressable, :update?
    address = @addressable.addresses.build(address_params)

    if address.save
      render json: serialize_address(address), status: 200
    else
      render json: { errors: address.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    authorize @addressable, :show?
    render json: serialize_address(@address)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Address not found" }, status: 404
  end

  def update
    authorize @addressable, :update?

    if @address.update(address_params)
      render json: serialize_address(@address)
    else
      render json: { errors: @address.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

    def set_addressable
      if params[:user_id]
        @addressable = User.find(params[:user_id])
      elsif params[:company_id]
        @addressable = Company.find(params[:company_id])
        # Check if user has access to this company
        # For show action with invalid address ID, return 404 instead of 403
        unless @addressable.id == current_user.current_workspace_id
          if action_name == "show" && params[:id].present?
            # Try to find the address first, if not found, return 404
            begin
              @addressable.addresses.find(params[:id])
            rescue ActiveRecord::RecordNotFound
              render json: { error: "Address not found" }, status: 404
              return
            end
          end
          raise Pundit::NotAuthorizedError
        end
      else
        render json: { error: "Addressable resource not found" }, status: 404
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Resource not found" }, status: 404
    end

    def set_address
      @address = @addressable.addresses.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Address not found" }, status: 404
    end

    def address_params
      params.require(:address).permit(:address_line_1, :address_line_2, :city, :state, :country, :pin)
    end

    def serialize_address(address)
      {
        id: address.id,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        city: address.city,
        state: address.state,
        country: address.country,
        pin: address.pin,
        created_at: address.created_at,
        updated_at: address.updated_at
      }
    end
end
