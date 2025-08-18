# frozen_string_literal: true

class Api::V1::Invoices::BulkDeletionController < Api::V1::ApplicationController
  def create
    authorize :create, policy_class: Invoices::BulkDeletionPolicy
    invoices = Invoice.where(id: params[:invoices_ids])
    invoices.destroy_all
    head 204
  end
end
