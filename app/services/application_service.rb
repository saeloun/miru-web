# frozen_string_literal: true

class ApplicationService
  def self.process(*args, &block)
    new(*args, &block).process
  end
end
