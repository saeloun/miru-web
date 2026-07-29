# frozen_string_literal: true

require "rails_helper"

RSpec.describe Zipper do
  it "removes directory traversal from archive entry names" do
    source = Tempfile.new(["invoice", ".pdf"])
    source.write("pdf")
    source.close
    zipper = described_class.new([{ name: "../../nested\\invoice.pdf", file: source }])

    zipper.zip

    entry_names = Zip::File.open(zipper.file.path) { |archive| archive.entries.map(&:name) }
    expect(entry_names).to eq(["invoice.pdf"])
  ensure
    zipper&.cleanup!
  end
end
