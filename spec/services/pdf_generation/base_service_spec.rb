# frozen_string_literal: true

require "rails_helper"

RSpec.describe PdfGeneration::BaseService do
  describe "#process" do
    let(:html_content) { "<html><body><h1>Test PDF</h1></body></html>" }
    let(:service) { described_class.new(html_content) }

    it "generates a PDF from HTML content" do
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data).to be_a(String)
      expect(pdf_data.encoding).to eq(Encoding::ASCII_8BIT)
      # PDF files start with %PDF
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    it "accepts custom options" do
      custom_options = {
        format: "A4",
        landscape: true,
        margin: { top: 10, bottom: 10, left: 10, right: 10 }
      }

      service = described_class.new(html_content, custom_options)
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
    end

    it "handles HTML with special characters" do
      html_with_special_chars = "<html><body><h1>Invoice #123 &amp; €100</h1></body></html>"
      service = described_class.new(html_with_special_chars)

      expect { service.process }.not_to raise_error
    end

    it "handles empty HTML content" do
      service = described_class.new("")
      pdf_data = service.process

      expect(pdf_data).not_to be_nil
      expect(pdf_data.bytesize).to be > 0
      expect(pdf_data[0..3]).to eq("%PDF")
    end

    context "with browser errors" do
      it "cleans up resources even on failure" do
        allow_any_instance_of(Ferrum::Browser).to receive(:go_to).and_raise(StandardError, "Browser error")

        expect { service.process }.to raise_error(StandardError, "Browser error")
      end
    end
  end

  describe "default options" do
    let(:service) { described_class.new("test") }

    it "has sensible defaults" do
      options = service.send(:default_options)

      expect(options[:format]).to eq("A4")
      expect(options[:landscape]).to eq(false)
      expect(options[:print_background]).to eq(true)
      expect(options[:margin]).to be_a(Hash)
    end
  end

  describe "browser startup timeout" do
    let(:service) { described_class.new("<html></html>") }

    it "uses the local default process timeout outside CI" do
      original_ci = ENV["CI"]
      original_test_env_number = ENV["TEST_ENV_NUMBER"]
      original_ferrum_process_timeout = ENV["FERRUM_PROCESS_TIMEOUT"]

      begin
        ENV.delete("CI")
        ENV.delete("TEST_ENV_NUMBER")
        ENV.delete("FERRUM_PROCESS_TIMEOUT")
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(process_timeout: 10))
      ensure
        ENV["CI"] = original_ci
        if original_test_env_number.nil?
          ENV.delete("TEST_ENV_NUMBER")
        else
          ENV["TEST_ENV_NUMBER"] = original_test_env_number
        end
        ENV["FERRUM_PROCESS_TIMEOUT"] = original_ferrum_process_timeout
      end
    end

    it "ignores blank browser path overrides and uses the first present fallback" do
      original_browser_path = ENV["BROWSER_PATH"]
      original_ferrum_browser_path = ENV["FERRUM_BROWSER_PATH"]
      original_google_chrome_shim = ENV["GOOGLE_CHROME_SHIM"]
      original_chrome_path = ENV["CHROME_PATH"]

      begin
        ENV["BROWSER_PATH"] = ""
        ENV["FERRUM_BROWSER_PATH"] = "/tmp/chromium"
        ENV.delete("GOOGLE_CHROME_SHIM")
        ENV.delete("CHROME_PATH")
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(browser_path: "/tmp/chromium"))
      ensure
        ENV["BROWSER_PATH"] = original_browser_path
        ENV["FERRUM_BROWSER_PATH"] = original_ferrum_browser_path
        ENV["GOOGLE_CHROME_SHIM"] = original_google_chrome_shim
        ENV["CHROME_PATH"] = original_chrome_path
      end
    end

    it "uses a longer process timeout on CI" do
      original_ci = ENV["CI"]
      original_ferrum_process_timeout = ENV["FERRUM_PROCESS_TIMEOUT"]

      begin
        ENV["CI"] = "true"
        ENV.delete("FERRUM_PROCESS_TIMEOUT")
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(process_timeout: 30))
      ensure
        ENV["CI"] = original_ci
        ENV["FERRUM_PROCESS_TIMEOUT"] = original_ferrum_process_timeout
      end
    end

    it "uses a longer process timeout in parallel test workers" do
      original_test_env_number = ENV["TEST_ENV_NUMBER"]
      original_ferrum_process_timeout = ENV["FERRUM_PROCESS_TIMEOUT"]

      begin
        ENV["TEST_ENV_NUMBER"] = ""
        ENV.delete("FERRUM_PROCESS_TIMEOUT")
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(process_timeout: 30))
      ensure
        if original_test_env_number.nil?
          ENV.delete("TEST_ENV_NUMBER")
        else
          ENV["TEST_ENV_NUMBER"] = original_test_env_number
        end
        ENV["FERRUM_PROCESS_TIMEOUT"] = original_ferrum_process_timeout
      end
    end

    it "allows overriding the process timeout via environment" do
      original_ferrum_process_timeout = ENV["FERRUM_PROCESS_TIMEOUT"]

      begin
        ENV["FERRUM_PROCESS_TIMEOUT"] = "45"
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(process_timeout: 45))
      ensure
        ENV["FERRUM_PROCESS_TIMEOUT"] = original_ferrum_process_timeout
      end
    end

    it "falls back to the default timeout when the override is invalid" do
      original_ci = ENV["CI"]
      original_test_env_number = ENV["TEST_ENV_NUMBER"]
      original_ferrum_process_timeout = ENV["FERRUM_PROCESS_TIMEOUT"]

      begin
        ENV.delete("CI")
        ENV.delete("TEST_ENV_NUMBER")
        ENV["FERRUM_PROCESS_TIMEOUT"] = "abc"
        allow(Ferrum::Browser).to receive(:new).and_return(instance_double(Ferrum::Browser, quit: true))

        service.send(:create_browser)

        expect(Ferrum::Browser).to have_received(:new).with(hash_including(process_timeout: 10))
      ensure
        ENV["CI"] = original_ci
        if original_test_env_number.nil?
          ENV.delete("TEST_ENV_NUMBER")
        else
          ENV["TEST_ENV_NUMBER"] = original_test_env_number
        end
        ENV["FERRUM_PROCESS_TIMEOUT"] = original_ferrum_process_timeout
      end
    end
  end
end
