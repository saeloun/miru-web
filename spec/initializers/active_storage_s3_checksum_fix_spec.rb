# frozen_string_literal: true

require "rails_helper"

# This spec tests the fix for MIRU-WEB-3G
# Issue: aws-sdk-s3 >= 1.208.0 causes "You can only specify one non-default checksum at a time" error
# Fix: Override upload_with_single_part to omit checksum_algorithm parameter
#
# This is a known compatibility issue between aws-sdk-s3 >= 1.208.0 and ActiveStorage
# No official Rails fix is available as of January 2026

# rubocop:disable RSpec/DescribeClass
RSpec.describe "ActiveStorage S3 Checksum Fix", type: :integration do
  before(:all) do
    require "active_storage/service/s3_service"
  end

  describe "S3Service monkey patch" do
    it "loads the S3Service class" do
      expect(defined?(ActiveStorage::Service::S3Service)).to be_truthy
    end

    it "has the upload_with_single_part method" do
      expect(ActiveStorage::Service::S3Service.private_method_defined?(:upload_with_single_part)).to be true
    end

    it "has the upload_with_multipart method" do
      expect(ActiveStorage::Service::S3Service.private_method_defined?(:upload_with_multipart)).to be true
    end

    it "has the url_for_direct_upload method" do
      expect(ActiveStorage::Service::S3Service.public_method_defined?(:url_for_direct_upload)).to be true
    end

    it "has the compose method" do
      expect(ActiveStorage::Service::S3Service.public_method_defined?(:compose)).to be true
    end

    it "upload_with_single_part accepts the correct parameters" do
      method = ActiveStorage::Service::S3Service.instance_method(:upload_with_single_part)
      params = method.parameters

      param_names = params.map { |type, name| name }
      expect(param_names).to include(:key, :io, :checksum, :content_type, :content_disposition, :custom_metadata)
    end

    it "does not send checksum_algorithm parameter to S3 in single-part upload" do
      s3_service = create_mock_s3_service
      s3_object = double("S3Object")
      test_io = StringIO.new("test content")

      allow(s3_service).to receive(:object_for).and_return(s3_object)
      allow(s3_object).to receive(:put) do |args|
        verify_s3_put_parameters(args)
      end

      s3_service.send(:upload_with_single_part, "test/key", test_io, checksum: "test_checksum")
    end

    it "does not send checksum_algorithm parameter to S3 in multipart upload" do
      s3_service = create_mock_s3_service
      s3_object = double("S3Object")
      test_io = StringIO.new("test content" * 1000) # Larger content for multipart

      allow(s3_service).to receive(:object_for).and_return(s3_object)
      allow(s3_object).to receive(:upload_stream) do |**args|
        verify_s3_multipart_parameters(args)
        # Yield to the block to simulate upload_stream behavior
        yield_block = proc {}
        yield_block.call if block_given?
      end

      s3_service.send(:upload_with_multipart, "test/key", test_io)
    end
  end

  describe "Company logo upload integration" do
    let(:user) { create(:user) }
    let(:company_params) do
      {
        name: "Test Company",
        country: "US",
        base_currency: "USD",
        standard_price: 100
      }
    end

    context "with logo attachment" do
      let(:logo_file) do
        file_path = Rails.root.join("spec", "support", "fixtures", "test-image.png")
        fixture_file_upload(file_path, "image/png")
      end

      it "creates company with logo without errors" do
        company = Company.new(company_params)
        company.logo.attach(logo_file)

        # This should not raise any errors (including S3 checksum errors)
        expect { company.save! }.not_to raise_error

        expect(company).to be_persisted
        expect(company.logo).to be_attached
      end

      it "allows updating company logo" do
        company = create(:company)

        expect { company.logo.attach(logo_file) }.not_to raise_error
        expect(company.logo).to be_attached
      end

      it "handles multiple logo uploads" do
        companies = []

        expect do
          3.times do
            company = Company.create!(company_params.merge(name: "Company #{SecureRandom.hex(4)}"))
            company.logo.attach(logo_file)
            companies << company
          end
        end.not_to raise_error

        companies.each do |company|
          expect(company.logo).to be_attached
        end
      end
    end
  end

  describe "Regression test for MIRU-WEB-3G" do
    let(:user) { create(:user) }

    it "reproduces the original error scenario without raising exception" do
      # This test reproduces the exact scenario from MIRU-WEB-3G
      # POST /internal_api/v1/companies with logo attachment

      company_params = {
        name: "MIRU-WEB-3G Test Company",
        country: "US",
        base_currency: "USD",
        standard_price: 100
      }

      logo_file = fixture_file_upload(
        Rails.root.join("spec", "support", "fixtures", "test-image.png"),
        "image/png"
      )

      # This was failing with:
      # Aws::S3::Errors::InvalidRequest: You can only specify one non-default checksum at a time
      # After fix: Should succeed without errors
      expect do
        service = CreateCompanyService.new(user, params: company_params.merge(logo: logo_file))
        company = service.process

        expect(company).to be_persisted
        expect(company.logo).to be_attached
      end.not_to raise_error
    end
  end

  private

    def create_mock_s3_service
      ActiveStorage::Service::S3Service.new(
        access_key_id: "test",
        secret_access_key: "test",
        region: "us-east-1",
        bucket: "test-bucket"
      )
    end

    def verify_s3_put_parameters(args)
      expect(args).to be_a(Hash)
      expect(args).to have_key(:body)
      expect(args).to have_key(:content_md5)
      expect(args).not_to have_key(:checksum_algorithm)
    end

    def verify_s3_multipart_parameters(args)
      expect(args).to be_a(Hash)
      expect(args).not_to have_key(:checksum_algorithm)
    end
end
# rubocop:enable RSpec/DescribeClass
