# frozen_string_literal: true

module PdfGeneration
  class BaseService < ApplicationService
    attr_reader :html_content, :options

    def initialize(html_content, options = {})
      @html_content = html_content
      @options = default_options.deep_merge(options)
    end

    def process
      generate_pdf
    end

    private

    def generate_pdf
      require "tempfile"
      
      tmp = Tempfile.new(["generated", ".pdf"])
      browser = create_browser
      
      begin
        # Load HTML content
        load_html_in_browser(browser)
        
        # Generate PDF
        browser.pdf(path: tmp.path, **pdf_options)
        
        # Read and return the PDF content
        File.read(tmp.path)
      ensure
        browser&.quit
        tmp.close
        tmp.unlink
      end
    end

    def create_browser
      Ferrum::Browser.new(
        headless: true,
        timeout: 30,
        browser_options: browser_options
      )
    end

    def browser_options
      {
        "no-sandbox": nil,
        "disable-gpu": nil,
        "disable-dev-shm-usage": nil,
        "disable-setuid-sandbox": nil
      }
    end

    def load_html_in_browser(browser)
      # Create a data URL from the HTML content
      html_data_url = "data:text/html;charset=utf-8," + ERB::Util.url_encode(html_content)
      browser.go_to(html_data_url)
      browser.network.wait_for_idle
    end

    def pdf_options
      {
        format: options[:format],
        landscape: options[:landscape],
        margin: options[:margin],
        printBackground: options[:print_background],
        displayHeaderFooter: options[:display_header_footer],
        headerTemplate: options[:header_template],
        footerTemplate: options[:footer_template],
        preferCSSPageSize: options[:prefer_css_page_size],
        scale: options[:scale],
        pageRanges: options[:page_ranges]
      }.compact
    end

    def default_options
      {
        format: :A4,
        landscape: false,
        margin: {
          top: 36,
          bottom: 36,
          left: 36,
          right: 36
        },
        print_background: true,
        display_header_footer: false,
        prefer_css_page_size: true,
        scale: 1
      }
    end
  end
end