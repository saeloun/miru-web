# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Active Storage blob disposition", type: :request do
  let(:png_data) do
    Base64.decode64(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )
  end

  let(:blob) do
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(png_data),
      filename: "receipt-photo.png",
      content_type: "image/png"
    )
  end

  def follow_blob_redirect(path)
    get path
    expect(response).to have_http_status(:found)
    get response.headers["Location"]
  end

  it "serves inline content types inline by default" do
    follow_blob_redirect rails_blob_path(blob, only_path: true)

    expect(response.headers["Content-Disposition"]).to start_with("inline")
  end

  it "serves as attachment when disposition=attachment is requested" do
    follow_blob_redirect rails_blob_path(blob, disposition: "attachment", only_path: true)

    expect(response.headers["Content-Disposition"]).to start_with("attachment")
  end

  it "allows the Rails default inline content types" do
    expect(ActiveStorage.content_types_allowed_inline).to include("image/png", "application/pdf")
  end
end
