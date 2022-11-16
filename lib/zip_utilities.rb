# frozen_string_literal: true

module ZipUtilities
  def uniq_zip_file_name
    Time.now.to_i.to_s + "_" + SecureRandom.alphanumeric(10) + ".zip"
  end

  def add_files_to_zip(zip_file, files)
    Zip::File.open(zip_file.path, create: true) do |zipfile|
      files.each do |file_name, file|
        zipfile.add(file_name, file.path)
      end
    end
  end

  def get_zip_file_data(zip_file)
    zip_data = File.read(zip_file.path)
    zip_file.close
    zip_data
  end
end
