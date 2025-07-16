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

    set_options(options)
  end

  def make
    html_content = make_html

    if @path
      generate_pdf_to_file(html_content)
    else
      generate_pdf_data(html_content)
    end
  end

  private

    def set_options(user_defined_options)
      @options = default_options.merge(user_defined_options)
    end

    def default_options
      {
        format: "A4",
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
        prefer_css_page_size: false,
        display_header_footer: false,
        print_background: true,
        wait_until: "networkidle0"
      }
    end

    def make_html
      html = ApplicationController.render(
        template: @template,
        layout: @layout,
        locals: @locals,
        assigns: { root_url: @root_url }
      )

      if @root_url
        process_relative_urls(html)
      else
        html
      end
    end

    def browser_options
      {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--no-first-run",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding"
        ]
      }
    end

    def generate_pdf_data(html_content)
      Puppeteer.launch(**browser_options) do |browser|
        page = browser.new_page
        page.set_content(html_content, wait_until: @options[:wait_until])

        pdf_options = {
          format: @options[:format],
          margin: @options[:margin],
          prefer_css_page_size: @options[:prefer_css_page_size],
          display_header_footer: @options[:display_header_footer],
          print_background: @options[:print_background]
        }

        page.pdf(pdf_options)
      end
    end

    def generate_pdf_to_file(html_content)
      Puppeteer.launch(**browser_options) do |browser|
        page = browser.new_page
        page.set_content(html_content, wait_until: @options[:wait_until])

        pdf_options = {
          path: @path,
          format: @options[:format],
          margin: @options[:margin],
          prefer_css_page_size: @options[:prefer_css_page_size],
          display_header_footer: @options[:display_header_footer],
          print_background: @options[:print_background]
        }

        page.pdf(pdf_options)
      end
    end

    # Replace relative URLs with absolute URLs for proper asset loading
    def process_relative_urls(html)
      html.gsub(%r{(src|href)=["']/([^"']*?)["']}, "\\1=\"#{@root_url}/\\2\"")
    end
end
