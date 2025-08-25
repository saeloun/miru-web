
# frozen_string_literal: true

class InternalApi::V1::VendorsController < ApplicationController
  def create
    authorize :create, policy_class: VendorPolicy

    vendor = current_company.vendors.create!(vendor_params)

    render :create, locals: { vendor: }
  end

  private

    def vendor_params
      params.require(:vendor).permit(:name)
    end
end
