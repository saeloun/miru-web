# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Companies::InvoiceSignaturesController", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  let(:valid_signature) do
    fixture_file_upload(
      Rails.root.join("spec", "support", "fixtures", "test-signature.png"),
      "image/png"
    )
  end

  let(:oversized_dimensions_signature) do
    fixture_file_upload(
      Rails.root.join("spec", "support", "fixtures", "test-signature-oversized.png"),
      "image/png"
    )
  end

  let(:invalid_content_type_file) do
    fixture_file_upload(
      Rails.root.join("spec", "support", "fixtures", "pdf-file.pdf"),
      "application/pdf"
    )
  end

  describe "POST /api/v1/companies/:company_id/invoice_signature" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "uploads a valid PNG and returns HTTP 200 with signature URL" do
        send_request(
          :post,
          api_v1_company_invoice_signature_path(company),
          params: { invoice_signature: valid_signature },
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:ok)
        expect(json_response["signature_url"]).to be_present
        expect(json_response["notice"]).to eq("Invoice signature uploaded successfully")
        expect(company.reload.invoice_signature).to be_attached
      end

      it "rejects a file with invalid content type with HTTP 422" do
        send_request(
          :post,
          api_v1_company_invoice_signature_path(company),
          params: { invoice_signature: invalid_content_type_file },
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Only PNG files are accepted")
        expect(company.reload.invoice_signature).not_to be_attached
      end

      it "rejects a PNG exceeding dimension limits with HTTP 422" do
        send_request(
          :post,
          api_v1_company_invoice_signature_path(company),
          params: { invoice_signature: oversized_dimensions_signature },
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("Dimensions must not exceed 300x150 pixels")
        expect(company.reload.invoice_signature).not_to be_attached
      end

      it "rejects a file exceeding 500KB with HTTP 422" do
        oversized_file = Tempfile.new(["large-signature", ".png"])
        oversized_file.binmode
        # Write a minimal valid PNG header followed by padding to exceed 500KB
        png_header = File.binread(Rails.root.join("spec", "support", "fixtures", "test-signature.png"))
        oversized_file.write(png_header)
        oversized_file.write("\x00" * (501.kilobytes - png_header.size))
        oversized_file.rewind

        large_upload = Rack::Test::UploadedFile.new(oversized_file.path, "image/png")

        send_request(
          :post,
          api_v1_company_invoice_signature_path(company),
          params: { invoice_signature: large_upload },
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["error"]).to eq("File size must not exceed 500KB")
        expect(company.reload.invoice_signature).not_to be_attached
      ensure
        oversized_file.close!
      end
    end

    context "when user is unauthorized" do
      let(:unauthorized_user) { create(:user, current_workspace_id: company.id) }

      before do
        create(:employment, company:, user: unauthorized_user)
        unauthorized_user.add_role :employee, company
        sign_in unauthorized_user
      end

      it "returns HTTP 403" do
        send_request(
          :post,
          api_v1_company_invoice_signature_path(company),
          params: { invoice_signature: valid_signature },
          headers: auth_headers(unauthorized_user)
        )

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/companies/:company_id/invoice_signature" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "deletes an attached signature and returns HTTP 200" do
        # First attach a signature
        file_path = Rails.root.join("spec", "support", "fixtures", "test-signature.png")
        company.invoice_signature.attach(
          io: File.open(file_path),
          filename: "signature.png",
          content_type: "image/png"
        )
        expect(company.invoice_signature).to be_attached

        send_request(
          :delete,
          api_v1_company_invoice_signature_path(company),
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Invoice signature removed")
        expect(company.reload.invoice_signature).not_to be_attached
      end

      it "returns HTTP 200 when no signature is attached" do
        expect(company.invoice_signature).not_to be_attached

        send_request(
          :delete,
          api_v1_company_invoice_signature_path(company),
          headers: auth_headers(user)
        )

        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Invoice signature removed")
      end
    end

    context "when user is unauthorized" do
      let(:unauthorized_user) { create(:user, current_workspace_id: company.id) }

      before do
        create(:employment, company:, user: unauthorized_user)
        unauthorized_user.add_role :employee, company
        sign_in unauthorized_user
      end

      it "returns HTTP 403" do
        send_request(
          :delete,
          api_v1_company_invoice_signature_path(company),
          headers: auth_headers(unauthorized_user)
        )

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
