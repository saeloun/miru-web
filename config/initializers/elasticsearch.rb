# frozen_string_literal: true

# Elasticsearch Configuration
#
# This initializer configures the Elasticsearch client used by Searchkick
# for full-text search functionality across the application.
#
# Configuration:
# - Client URL: Uses ELASTICSEARCH_URL environment variable or defaults to localhost:9200
# - Search timeout: Set to 300 seconds to handle complex queries
# - Index prefix: Namespaces indices by environment (e.g., miru_development_, miru_production_)
#
# Environment Variables:
# - ELASTICSEARCH_URL: The URL of the Elasticsearch server (optional, defaults to http://localhost:9200)

# Initialize the Elasticsearch client with the configured URL
Searchkick.client = Elasticsearch::Client.new(url: ENV["ELASTICSEARCH_URL"] || "http://localhost:9200")

# Set the maximum time (in seconds) to wait for search queries to complete
Searchkick.search_timeout = 300

# Add environment-specific prefix to all search indices for namespace isolation
Searchkick.index_prefix = "miru_#{Rails.env}_"
