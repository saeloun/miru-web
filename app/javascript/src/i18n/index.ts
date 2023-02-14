import { I18n } from "i18n-js";

const i18n = new I18n({
  en: {
    invalidImageFormatSize:
      "Incorrect file format. Please upload an image of type PNG or JPG. Max size (%{fileSize}kb)",
    invalidImageSize: "File size exceeded the max limit of %{fileSize}KB.",
    invalidImageFormat:
      "Incorrect file format. Please upload an image of type PNG or JPG",
  },
});

export { i18n };
