# frozen_string_literal: true

class Api::V1::Companies::InvoiceSignaturesController < Api::V1::ApplicationController
  PNG_SIGNATURE = "\x89PNG\r\n\x1A\n".b
  PNG_HEADER_BYTES = 24

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

    file = params[:invoice_signature]

    unless file.content_type == "image/png"
      return render json: { error: "Only PNG files are accepted" }, status: :unprocessable_entity
    end

    if file.size > 500.kilobytes
      return render json: { error: "File size must not exceed 500KB" }, status: :unprocessable_entity
    end

    dimensions = png_dimensions(file)

    unless dimensions
      return render json: { error: "File is not a valid PNG image" }, status: :unprocessable_entity
    end

    width, height = dimensions

    if width > 300 || height > 150
      return render json: { error: "Dimensions must not exceed 300x150 pixels" }, status: :unprocessable_entity
    end

    current_company.invoice_signature.attach(file)

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

  private

    def png_dimensions(file)
      file.tempfile.rewind
      header = file.tempfile.read(PNG_HEADER_BYTES)
      return nil unless header&.bytesize == PNG_HEADER_BYTES
      return nil unless header.byteslice(0, PNG_SIGNATURE.bytesize) == PNG_SIGNATURE

      header.byteslice(16, 8).unpack("NN")
    ensure
      file.tempfile.rewind
    end
end
