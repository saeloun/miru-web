# frozen_string_literal: true

require "rails_helper"
require "open3"
require "vips"

RSpec.describe "Active Storage native image boundary" do
  it "blocks direct and automatically selected OpenEXR decoding after Rails boots" do
    fixture = Rails.root.join("scripts/ci/fixtures/openexr/stripes.exr").to_s
    output, status = Open3.capture2e(Gem.ruby, "-rvips", "-e", <<~RUBY, fixture)
      Vips.cache_set_max(0)
      image = Vips::Image.openexrload(ARGV.fetch(0))
      abort "Invalid EXR control" unless [image.width, image.height] == [100, 50] && image.avg.finite?
    RUBY
    flags = Vips.vips_operation_get_flags(Vips::Operation.new("openexrload").ptr)

    expect(status.success?).to be(true), output
    expect(flags & 32).to eq(32)
    expect { Vips::Image.openexrload(fixture).avg }.to raise_error(Vips::Error, /blocked/)
    expect { Vips::Image.new_from_file(fixture).avg }.to raise_error(Vips::Error, /not a known file format/)
    expect do
      ImageProcessing::Vips.source(fixture).resize_to_fill(72, 72).call
    end.to raise_error(Vips::Error, /not a known file format/)
  end
end
