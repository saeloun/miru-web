# frozen_string_literal: true

Searchkick.client = Elasticsearch::Client.new(url: ENV["ELASTICSEARCH_URL"])
Searchkick.search_timeout = 300
