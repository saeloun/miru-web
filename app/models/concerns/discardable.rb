# frozen_string_literal: true

module Discardable
  extend ActiveSupport::Concern

  included do
    include Discard::Model
  end
end
