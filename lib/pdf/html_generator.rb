# frozen_string_literal: true

class Pdf::HtmlGenerator
  attr_accessor :template, :layout, :locals, :root_url

  def initialize(template, layout: "layouts/pdf", locals: {}, options: {}, path: nil, root_url: nil)
    # all HTML template files must be stored inside app/views/pdfs folder
    @template = "pdfs/#{template}"
    @layout = layout
    @locals = locals
    @path = path
    @root_url = root_url
    @options = options
  end

  def make
    html = make_html

    # Use Ferrum PDF for generation
    pdf_options = {
      format: "A4",
      margin: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in"
      },
      print_background: true,
      display_header_footer: false
    }

    # Merge with any provided options
    pdf_options.merge!(@options) if @options.present?

    # Generate PDF using Ferrum PDF
    FerrumPdf::Browser.new do |browser|
      browser.pdf_from_html(html, pdf_options)
    end
  end

  private

    def make_html
      html = ActionController::Base.new.render_to_string(
        template:,
        layout:,
        locals:
      )

      # Process URLs in HTML to be absolute if root_url is provided
      if root_url
        process_html_urls(html)
      else
        html
      end
    end

    def process_html_urls(html)
      # Convert relative URLs to absolute URLs
      html.gsub(/(?:src|href)=["']\/([^"']+)["']/) do |match|
        match.sub(/\/#{$1}/, "#{root_url}/#{$1}")
      end
    end
end
