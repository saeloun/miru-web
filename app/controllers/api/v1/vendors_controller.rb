# frozen_string_literal: true

class Api::V1::VendorsController < Api::V1::BaseController
  before_action :set_vendor, only: [:show, :update, :destroy]
  after_action :verify_authorized, except: [:index]

  def index
    vendors = current_company.vendors.kept.order(:name)
    render json: { vendors: vendors.map { |v| serialize_vendor(v) } }, status: 200
  end

  def show
    authorize @vendor
    render json: { vendor: serialize_vendor(@vendor) }, status: 200
  end

  def create
    @vendor = current_company.vendors.build(vendor_params)
    authorize @vendor

    if @vendor.save
      render json: { vendor: serialize_vendor(@vendor), notice: "Vendor created successfully" }, status: 201
    else
      render json: { errors: @vendor.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @vendor

    if @vendor.update(vendor_params)
      render json: { vendor: serialize_vendor(@vendor), notice: "Vendor updated successfully" }, status: 200
    else
      render json: { errors: @vendor.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @vendor

    if @vendor.discard
      render json: { notice: "Vendor deleted successfully" }, status: 200
    else
      render json: { errors: ["Failed to delete vendor"] }, status: :unprocessable_entity
    end
  end

  private

    def set_vendor
      @vendor = current_company.vendors.kept.find(params[:id])
    end

    def vendor_params
      params.require(:vendor).permit(:name, :email, :phone, :address, :tax_id, :description)
    end

    def serialize_vendor(vendor)
      {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        tax_id: vendor.tax_id,
        description: vendor.description,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at
      }
    end
end
