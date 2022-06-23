# frozen_string_literal: true

class Invoices::ViewController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def show
    render :show, locals: { invoice: }, layout: false
  end

  def invoice
    @_invoice ||= Invoice.includes(:client, :invoice_line_items).find_by!(external_view_key: params[:id])
  end
end
