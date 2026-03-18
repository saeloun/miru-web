# frozen_string_literal: true

class ApplicationService
  def self.process(*args, **kwargs, &block)
    new(*args, **kwargs, &block).process
  end
end
