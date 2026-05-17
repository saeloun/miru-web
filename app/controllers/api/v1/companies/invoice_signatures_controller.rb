# frozen_string_literal: true

require "mini_magick"

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

    file = params[:invoice_signature]

    unless file.content_type == "image/png"
      return render json: { error: "Only PNG files are accepted" }, status: :unprocessable_entity
    end

    if file.size > 500.kilobytes
      return render json: { error: "File size must not exceed 500KB" }, status: :unprocessable_entity
    end

    image = nil

    begin
      file.tempfile.rewind
      image = MiniMagick::Image.read(file.tempfile)

      if image.width > 300 || image.height > 150
        return render json: { error: "Dimensions must not exceed 300x150 pixels" }, status: :unprocessable_entity
      end
    rescue MiniMagick::Error, MiniMagick::Invalid
      return render json: { error: "File is not a valid PNG image" }, status: :unprocessable_entity
    ensure
      image.destroy! if image&.respond_to?(:destroy!)
      file.tempfile.rewind
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
end
