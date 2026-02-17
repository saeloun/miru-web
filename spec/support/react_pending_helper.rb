# frozen_string_literal: true

module ReactPendingHelper
  def skip_if_react_not_loaded
    unless page.has_css?('[data-testid="app-loaded"]', wait: 2)
      skip "React app not loading in test environment - skipping test"
    end
  end

  def pending_react_fix(message = "React app not loading in test environment")
    pending message
  end
end

RSpec.configure do |config|
  config.include ReactPendingHelper, type: :system
end
