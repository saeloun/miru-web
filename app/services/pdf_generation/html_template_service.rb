# frozen_string_literal: true

module PdfGeneration
  class HtmlTemplateService < BaseService
    attr_reader :template, :layout, :locals, :root_url

    def initialize(template, layout: "layouts/pdf", locals: {}, options: {}, root_url: nil)
      @template = template
      @layout = layout
      @locals = locals
      @root_url = root_url

      html = render_html_from_template
      super(html, options)
    end

    private

      def render_html_from_template
        html = ActionController::Base.new.render_to_string(
          template:,
          layout:,
          locals:
        )

        root_url ? process_urls_in_html(html) : html
      end

      def process_urls_in_html(html)
        html.gsub(/(?:src|href)=["']\/([^"']+)["']/) do |match|
          path = Regexp.last_match(1)
          match.sub("/#{path}", "#{root_url}/#{path}")
        end
      end
  end
end
