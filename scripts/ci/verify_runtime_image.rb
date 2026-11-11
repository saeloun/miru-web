# frozen_string_literal: true

require "active_support/all"
require "base64"
require "erb"
require "ferrum"
require "json"
require "open3"
require "tmpdir"
require_relative "../../app/services/application_service"
require_relative "../../app/services/pdf_generation/base_service"

def capture!(*command)
  output, status = Open3.capture2e(*command)
  abort "#{command.first} failed: #{output}" unless status.success?
  output
end

abort "Runtime must run without root" if Process.uid.zero?
abort "Build dependencies remain" if File.exist?("node_modules") || File.symlink?("node_modules")
abort "Patched JSON is required" if Gem::Version.new(JSON::VERSION) < Gem::Version.new("2.19.9")
abort "Obsolete default JSON remains" if Gem::Specification.find_all_by_name("json").any? do |spec|
  spec.default_gem? && spec.version < Gem::Version.new("2.19.9")
end

exr = File.expand_path("fixtures/openexr/stripes.exr", __dir__)
# A separate process proves the fixture decodes without weakening the application's boundary.
capture!(Gem.ruby, "-rvips", "-e", <<~RUBY, exr)
  Vips.cache_set_max(0)
  image = Vips::Image.new_from_file(ARGV.fetch(0))
  abort "Invalid EXR control" unless [image.width, image.height] == [100, 50] && image.avg.finite?
RUBY
require "active_storage/vips"
Vips.cache_set_max(0)
flags = Vips.vips_operation_get_flags(Vips::Operation.new("openexrload").ptr)
abort "OpenEXR loader is not blocked" unless flags & 32 == 32
begin
  Vips::Image.openexrload(exr).avg
  abort "Direct OpenEXR decoding remains available"
rescue Vips::Error => error
  abort "Unexpected OpenEXR refusal" unless error.message.include?("blocked")
end
begin
  Vips::Image.new_from_file(exr).avg
  abort "Automatic OpenEXR decoding remains available"
rescue Vips::Error => error
  abort "Unexpected automatic loader refusal" unless error.message.include?("not a known file format")
end
begin
  ImageProcessing::Vips.source(exr).resize_to_fill(72, 72).call
  abort "OpenEXR thumbnail processing remains available"
rescue Vips::Error => error
  abort "Unexpected thumbnail refusal" unless error.message.include?("not a known file format")
end

manifests = %w[manifest.json manifest-assets.json].map do |name|
  JSON.parse(File.read(File.join("public/vite/.vite", name)))
end
manifests.each do |manifest|
  abort "Compiled assets are missing" if manifest.empty?
  manifest.each_value do |entry|
    [entry["file"], *entry["css"], *entry["assets"]].compact.each do |asset|
      abort "Missing compiled asset: #{asset}" unless File.file?(File.join("public/vite", asset))
    end
    [*entry["imports"], *entry["dynamicImports"]].each do |key|
      abort "Missing compiled import: #{key}" unless manifest.key?(key)
    end
  end
end
%w[/build/pdf.worker.min.mjs /cmaps/ /standard_fonts/ /wasm/openjpeg.wasm /LICENSE].each do |resource|
  abort "Missing PDF resource: #{resource}" unless manifests.first.keys.any? { |key| key.include?("pdfjs-dist") && key.include?(resource) }
end
abort "PDF worker is missing" unless Dir["public/vite/assets/*.mjs"].any? do |path|
  File.read(path).include?("pdfjsWorker")
end

Dir.mktmpdir("miru-runtime-check") do |directory|
  %w[png jpg webp].each do |extension|
    source = File.join(directory, "source.#{extension}")
    thumbnail = File.join(directory, "#{extension}-thumbnail.png")
    Vips::Image.black(140, 90).new_from_image([40, 75, 160]).write_to_file(source)
    ImageProcessing::Vips.source(source).resize_to_fill(72, 72).call(destination: thumbnail)
    image = Vips::Image.new_from_file(thumbnail)
    abort "Invalid #{extension} thumbnail" unless [image.width, image.height] == [72, 72] && image.avg.between?(80, 105)
  end

  logo = Base64.strict_encode64(File.binread(File.join(directory, "png-thumbnail.png")))
  html = <<~HTML
    <!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: "Noto Sans", sans-serif; }
    .devanagari { font-family: "Noto Sans Devanagari", sans-serif; }
    </style></head><body><h1>Runtime invoice check</h1><p>₹12345.67</p>
    <p class="devanagari">मराठी</p><img src="data:image/png;base64,#{logo}">
    </body></html>
  HTML
  pdf = File.join(directory, "invoice.pdf")
  File.binwrite(pdf, PdfGeneration::BaseService.process(html))
  capture!("qpdf", "--check", pdf)
  abort "Invalid PDF page count" unless capture!("pdfinfo", pdf).match?(/^Pages:\s+1$/)
  text = capture!("pdftotext", "-layout", pdf, "-")
  abort "PDF text is missing" unless ["Runtime invoice check", "₹12345.67", "मराठी"].all? { |value| text.include?(value) }
  abort "PDF logo is missing" unless capture!("pdfimages", "-list", pdf).match?(/^\s*1\s+\d+\s+image\s+72\s+72\s+/)
  fonts = capture!("pdffonts", pdf)
  abort "Devanagari font is missing" unless fonts.include?("NotoSansDevanagari")
  abort "PDF font is not embedded" unless fonts.lines.drop(2).all? do |line|
    line.match?(/\s+yes\s+(?:yes|no)\s+yes\s+\d+\s+\d+\s*$/)
  end
end

puts "Runtime image verified: patched JSON, Active Storage OpenEXR boundary, compiled assets, PDF worker, logo resizing and Unicode PDF"
