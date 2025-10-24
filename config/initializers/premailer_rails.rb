# frozen_string_literal: true

Premailer::Rails.config.merge!(
  remove_ids: false,
  remove_classes: false,
  remove_comments: true,
  preserve_styles: true,
  generate_text_part: false,
  strategies: [:filesystem, :asset_pipeline]
)
