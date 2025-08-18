# frozen_string_literal: true

class Api::V1::GenerateInvoiceController < Api::V1::BaseController
  after_action :verify_authorized

  def create
    @client = current_company.clients.find(params[:client_id])
    authorize Invoice, :create?

    service = GenerateInvoiceService.new(
      client: @client,
      selected_project_ids: params[:project_ids],
      date_range: params[:date_range],
      invoice_params: invoice_params
    )

    result = service.process

    if result[:success]
      render json: {
        invoice: serialize_invoice(result[:invoice]),
        notice: "Invoice generated successfully"
      }, status: 201
    else
      render json: { errors: result[:errors] }, status: :unprocessable_entity
    end
  end

  private

    def invoice_params
      params.permit(:issue_date, :due_date, :invoice_number, :reference, :amount, :discount, :tax)
    end

    def serialize_invoice(invoice)
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client.name,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        amount: invoice.amount,
        outstanding_amount: invoice.outstanding_amount,
        status: invoice.status,
        reference: invoice.reference,
        discount: invoice.discount,
        tax: invoice.tax,
        currency: invoice.currency
      }
    end
end
