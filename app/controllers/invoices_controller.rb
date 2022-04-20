# frozen_string_literal: true

class InvoicesController < ApplicationController
  def index
    authorize :invoice
  end

  def show
    authorize Invoice
    render :show, locals: {
      invoice: Invoice.includes(:invoice_line_items, :client)
        .find(params[:id]).as_json(include: [:invoice_line_items, :client])
        .merge(company: {
          id: current_company.id,
          logo: current_company.logo.attached? ? polymorphic_url(current_company.logo) : "",
          name: current_company.name,
          phone_number: current_company.business_phone,
          address: current_company.address,
          country: current_company.country
        })
    }
  end
end
