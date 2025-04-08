# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = "1.0"

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in the app/assets
# folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )

# Setting `Rails.application.config.assets.css_compressor = nil` is disabling the CSS compression for
# assets in a Ruby on Rails application. By setting it to `nil`, the CSS files will not be compressed
# when they are served to the client. We are using cssbundling-rails gem to compress the CSS files.
Rails.application.config.assets.css_compressor = nil
