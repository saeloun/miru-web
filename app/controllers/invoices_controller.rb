# frozen_string_literal: true

class InvoicesController < ApplicationController
  def index
    authorize :invoice
  end

  def show
    authorize Invoice
    render :show, locals: {
      invoice: Invoice.includes(:invoice_line_items)
        .find(params[:id]).as_json(include: :invoice_line_items)
    }
  end
end
