# frozen_string_literal: true

if ENV["ELASTIC_SEARCH_PREFIX"]
  Searchkick.index_prefix = ENV["ELASTIC_SEARCH_PREFIX"]
end
