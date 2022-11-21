# frozen_string_literal: true

class ZipFile
  def initialize
    @zip_file = Tempfile.new(Time.now.to_i.to_s + "_" + SecureRandom.alphanumeric(10) + ".zip")
  end

  def file
    @zip_file
  end

  def add_files(files)
    Zip::File.open(@zip_file.path, create: true) do |zipfile|
      files.each do |file_name, file|
        zipfile.add(file_name, file.path)
      end
    end
  end

  def read
    zip_data = File.read(@zip_file.path)
    @zip_file.close
    zip_data
  end
end
