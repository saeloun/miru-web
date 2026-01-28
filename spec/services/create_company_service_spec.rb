# frozen_string_literal: true

require "rails_helper"

RSpec.describe CreateCompanyService, type: :service do
  let(:user) { create(:user) }
  let(:company_params) do
    {
      name: "Test Company",
      country: "US",
      base_currency: "USD",
      standard_price: 100,
      business_phone: "1234567890",
      timezone: "Eastern Time (US & Canada)"
    }
  end

  describe "#process" do
    context "when creating a company without logo" do
      it "creates a company successfully" do
        service = described_class.new(user, params: company_params)

        expect { service.process }.to change(Company, :count).by(1)

        company = service.company
        expect(company).to be_persisted
        expect(company.name).to eq("Test Company")
        expect(company.users).to include(user)
      end

      it "adds the user to the company with owner role" do
        service = described_class.new(user, params: company_params)
        company = service.process

        expect(user.has_role?(:owner, company)).to be true
        expect(user.current_workspace_id).to eq(company.id)
      end

      it "creates notification preference for the user" do
        service = described_class.new(user, params: company_params)

        expect { service.process }.to change(NotificationPreference, :count).by(1)

        company = service.company
        notification_pref = NotificationPreference.find_by(user:, company:)
        expect(notification_pref).to be_present
      end
    end

    context "when creating a company with logo" do
      let(:logo_file) do
        file_path = Rails.root.join("spec", "support", "fixtures", "test-image.png")
        fixture_file_upload(file_path, "image/png")
      end

      let(:company_params_with_logo) do
        company_params.merge(logo: logo_file)
      end

      it "creates a company with attached logo successfully" do
        service = described_class.new(user, params: company_params_with_logo)
        company = service.process

        expect(company).to be_persisted
        expect(company.logo).to be_attached
        expect(company.logo.filename.to_s).to eq("test-image.png")
        expect(company.logo.content_type).to eq("image/png")
      end

      it "stores the logo in ActiveStorage" do
        service = described_class.new(user, params: company_params_with_logo)

        expect { service.process }.to change(ActiveStorage::Attachment, :count).by(1)
          .and change(ActiveStorage::Blob, :count).by(1)
      end

      # This test verifies the fix for MIRU-WEB-3G
      # It ensures that logo uploads work with aws-sdk-s3 >= 1.208.0
      context "with S3 storage service" do
        before do
          # Skip this test if not using S3 service in test environment
          s3_service_defined = defined?(ActiveStorage::Service::S3Service)
          s3_service_in_use = ActiveStorage::Blob.service.is_a?(ActiveStorage::Service::S3Service)
          skip "S3 service not configured for tests" unless s3_service_defined && s3_service_in_use
        end

        it "uploads logo to S3 without checksum conflicts" do
          service = described_class.new(user, params: company_params_with_logo)

          # This should not raise Aws::S3::Errors::InvalidRequest
          expect { service.process }.not_to raise_error

          company = service.company
          expect(company.logo).to be_attached

          # Verify the blob was uploaded to S3
          blob = company.logo.blob
          expect(blob.service_name).to eq("cloudflare")
        end
      end
    end

    context "when company creation fails" do
      let(:invalid_params) do
        company_params.merge(name: nil) # name is required
      end

      it "raises an error and does not create the company" do
        service = described_class.new(user, params: invalid_params)

        expect { service.process }.to raise_error(ActiveRecord::RecordInvalid)
        expect(Company.where(name: nil)).to be_empty
      end

      it "does not add user to company on failure" do
        service = described_class.new(user, params: invalid_params)

        expect { service.process rescue nil }.not_to change(user.companies, :count)
      end
    end

    context "when using existing company object" do
      let(:company) { build(:company) }

      it "saves the provided company" do
        service = described_class.new(user, company:)
        result = service.process

        expect(result).to eq(company)
        expect(company).to be_persisted
      end
    end
  end
end
