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
        require "base64"

        browser = create_browser

        begin
          load_html_in_browser(browser)

          pdf_base64 = browser.pdf(**pdf_options)

          Base64.decode64(pdf_base64)
        ensure
          browser&.quit
        end
      end

      def create_browser
        opts = {
          headless: true,
          timeout: 30,
          browser_options:
        }

        browser_path = ENV["FERRUM_BROWSER_PATH"] || ENV["GOOGLE_CHROME_SHIM"] || ENV["CHROME_PATH"]
        if browser_path && !browser_path.empty?
          opts[:browser_path] = browser_path
        end

        Ferrum::Browser.new(**opts)
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
        opts = {
          format: options[:format].to_sym,
          landscape: options[:landscape],
          margin: options[:margin],
          print_background: options[:print_background],
          display_header_footer: options[:display_header_footer],
          header_template: options[:header_template],
          footer_template: options[:footer_template],
          prefer_css_page_size: options[:prefer_css_page_size],
          scale: options[:scale],
          page_ranges: options[:page_ranges]
        }

        opts.compact
      end

      def default_options
        {
          format: "A4",
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
