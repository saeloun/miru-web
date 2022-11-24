# frozen_string_literal: true

class TempPdf
  attr_accessor :pdf_content, :name

  def initialize(pdf_content, name)
    @pdf_content = pdf_content
    @name = name
  end

  def tempfile
    Tempfile.open do |file|
      utf_8_encoded_content = pdf_content.encode(
        "UTF-8",
        invalid: :replace,
        undef: :replace,
        replace: "?"
      )

      file.write(utf_8_encoded_content)
      file.rewind
      file
    end
  end
end
