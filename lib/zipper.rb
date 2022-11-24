# frozen_string_literal: true

class Zipper
  require "zip"

  attr_accessor :tempfile, :files_hash

  def initialize(files_hash)
    @tempfile = Tempfile.new(randomized_name)
    @files_hash = files_hash
  end

  def zip
    Zip::File.open(tempfile.path, create: true) do |zipfile|
      files_hash.each do |file_hash|
        zipfile.add(file_hash[:name], file_hash[:file])
      end
    end
  end

  def read
    zip_data = File.read(tempfile.path)
    tempfile.close
    zip_data
  end

  def cleanup!
    files_hash.each do |file_hash|
      file_hash[:file].unlink
    end
    tempfile.unlink
  end

  private

    def randomized_name
      "#{Time.now.to_i}_#{SecureRandom.alphanumeric(10)}.zip"
    end
end
