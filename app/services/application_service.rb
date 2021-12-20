# frozen_string_literal: true

class ApplicationService
  def self.process(*args)
    new(*args).process
  end
end
