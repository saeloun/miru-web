import { isValidPhoneNumber } from "libphonenumber-js";

const MIN_PHONE_DIGITS = 2;
const MAX_PHONE_DIGITS = 15;
const INTERNATIONAL_PHONE_PREFIX = /^\s*\+/;

const phoneDigitsCount = (phoneNumber?: string | null) =>
  (phoneNumber || "").replace(/\D/g, "").length;

export const hasMinimumPhoneDigits = (phoneNumber?: string | null) =>
  !phoneNumber || phoneDigitsCount(phoneNumber) >= MIN_PHONE_DIGITS;

export const hasMaximumPhoneDigits = (phoneNumber?: string | null) =>
  !phoneNumber || phoneDigitsCount(phoneNumber) <= MAX_PHONE_DIGITS;

export const isValidOptionalPhoneNumber = (phoneNumber?: string | null) =>
  !phoneNumber ||
  (INTERNATIONAL_PHONE_PREFIX.test(phoneNumber) &&
    isValidPhoneNumber(phoneNumber));
