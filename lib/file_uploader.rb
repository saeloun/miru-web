# frozen_string_literal: true

class FileUploader
  attr_accessor :file, :filename, :blob

  def initialize(file, filename)
    @file = file
    @filename = filename
    @blob = nil
  end

  def upload
    @blob = ActiveStorage::Blob.create_and_upload!(io: File.open(file), filename:)
  end

  def url
    @blob.url if blob
  end

  def delete_after(duration)
    DeleteActiveStorageBlobJob.set(wait: duration).perform_later(blob)
  end
end
