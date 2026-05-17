# frozen_string_literal: true

class Api::V1::Companies::InvoiceSignaturesController < Api::V1::ApplicationController
  def show
    authorize current_company, :show?

    if current_company.invoice_signature.attached?
      render json: {
        attached: true,
        signature_url: polymorphic_url(current_company.invoice_signature),
        filename: current_company.invoice_signature.filename.to_s
      }, status: 200
    else
      render json: { attached: false }, status: 200
    end
  end

  def create
    authorize current_company, :update?

    result = Companies::InvoiceSignatureUploadService.process(
      company: current_company,
      file: params[:invoice_signature]
    )
    return render json: { error: result.error }, status: :unprocessable_entity unless result.success?

    render json: {
      signature_url: polymorphic_url(current_company.invoice_signature),
      notice: "Invoice signature uploaded successfully"
    }, status: 200
  end

  def destroy
    authorize current_company, :update?

    current_company.invoice_signature.purge if current_company.invoice_signature.attached?

    render json: { notice: "Invoice signature removed" }, status: 200
  end
end
