# frozen_string_literal: true

require "rails_helper"
require "uri"

RSpec.describe FileUploader, type: :class do
  describe "#upload" do
    before do
      file_uploader = FileUploader.new(Tempfile.new(), "abc")
      @blob_obj = file_uploader.upload
    end

    it "uploads the file and returns the blob object" do
      expect(@blob_obj).to be_a ActiveStorage::Blob
    end

    it "checks if correct filename is set" do
      expect(@blob_obj.filename.to_s).to eq("abc")
    end
  end

  describe "#url" do
    before do
      ActiveStorage::Current.url_options = { host: "localhost" }
      file = Tempfile.new()
      file.write("123")
      file.close
      file_uploader = FileUploader.new(file, "abc")
      @blob_obj = file_uploader.upload
    end

    it "returns the url for the uploaded file" do
      expect(@blob_obj.url).to match URI.regexp
    end
  end

  describe "#delete_after" do
    before do
      @file_uploader = FileUploader.new(Tempfile.new(), "abc")
      @blob_obj = @file_uploader.upload
      @file_uploader.delete_after(1.seconds)
    end

    it "check if DeleteActiveStorageBlobJob job is queued" do
      expect(DeleteActiveStorageBlobJob).to have_been_enqueued
    end
  end
end
