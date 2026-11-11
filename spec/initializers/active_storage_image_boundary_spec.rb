# frozen_string_literal: true

require "rails_helper"
require "vips"

RSpec.describe "Active Storage native image boundary" do
  it "blocks direct and automatically selected OpenEXR decoding after Rails boots" do
    fixture = Rails.root.join("scripts/ci/fixtures/openexr/stripes.exr").to_s
    flags = Vips.vips_operation_get_flags(Vips::Operation.new("openexrload").ptr)

    expect(flags & 32).to eq(32)
    expect { Vips::Image.openexrload(fixture).avg }.to raise_error(Vips::Error, /blocked/)
    expect { Vips::Image.new_from_file(fixture).avg }.to raise_error(Vips::Error, /not a known file format/)
    expect do
      ImageProcessing::Vips.source(fixture).resize_to_fill(72, 72).call
    end.to raise_error(Vips::Error, /not a known file format/)
  end

  it "still processes an uploaded company logo through Active Storage" do
    company = create(:company, :with_logo)
    thumbnail = company.logo.variant(resize_to_fill: [72, 72]).processed
    image = Vips::Image.new_from_buffer(thumbnail.download, "")

    expect([image.width, image.height]).to eq([72, 72])
    expect(image.avg).to be_finite
  end
end
