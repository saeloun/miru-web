import { isValidPhoneNumber } from "libphonenumber-js";

const MIN_PHONE_DIGITS = 2;
const MAX_PHONE_DIGITS = 15;

const phoneDigitsCount = (phoneNumber?: string | null) =>
  (phoneNumber || "").replace(/\D/g, "").length;

export const hasMinimumPhoneDigits = (phoneNumber?: string | null) =>
  !phoneNumber || phoneDigitsCount(phoneNumber) >= MIN_PHONE_DIGITS;

export const hasMaximumPhoneDigits = (phoneNumber?: string | null) =>
  !phoneNumber || phoneDigitsCount(phoneNumber) <= MAX_PHONE_DIGITS;

export const isValidOptionalPhoneNumber = (phoneNumber?: string | null) =>
  !phoneNumber || isValidPhoneNumber(phoneNumber);
