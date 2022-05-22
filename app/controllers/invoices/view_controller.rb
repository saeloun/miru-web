# frozen_string_literal: true

class Invoices::ViewController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def show
    @invoice = Invoice.includes(:client, :invoice_line_items).find(params[:id])
    render :show, layout: false
  end
end
