# frozen_string_literal: true

class DeleteActiveStorageBlobJob < ApplicationJob
  def perform(blob)
    blob.destroy
  end
end
