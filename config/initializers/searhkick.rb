# frozen_string_literal: true

require "pagy/extras/searchkick"

Searchkick.extend Pagy::Searchkick

if ENV["ELASTIC_SEARCH_PREFIX"]
  Searchkick.index_prefix = ENV["ELASTIC_SEARCH_PREFIX"]
end
