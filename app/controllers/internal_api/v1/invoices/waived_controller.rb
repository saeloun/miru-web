# frozen_string_literal: true

class InternalApi::V1::Invoices::WaivedController < ApplicationController
  def update
    authorize :update, policy_class: Invoices::WaivedPolicy
    invoice.waived!
  end

  private

    def invoice
      @_invoice ||= Invoice.includes(:client, :invoice_line_items).find(params[:id])
    end
end
