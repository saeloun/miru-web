import SparkMD5 from "spark-md5";

export const getGravatarUrl = (
  email: string,
  size: number = 80,
  defaultImage: string = "mp"
): string => {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = SparkMD5.hash(normalizedEmail);

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
};

const DEFAULT_AVATAR_PATTERNS = [
  /(?:^|\/)avatar(?:-[^/?]+)?\.svg(?:[?#].*)?$/i,
  /(?:^|\/)user_avatar(?:-[^/?]+)?\.svg(?:[?#].*)?$/i,
];

const isPlaceholderAvatar = (avatarUrl?: string | null) =>
  !avatarUrl ||
  DEFAULT_AVATAR_PATTERNS.some(pattern => pattern.test(avatarUrl));

export const getDisplayAvatarUrl = (
  avatarUrl?: string | null,
  email?: string | null,
  size: number = 80
) => {
  if (!isPlaceholderAvatar(avatarUrl)) {
    return avatarUrl;
  }

  if (email?.trim()) {
    return getGravatarUrl(email, size);
  }

  return avatarUrl || undefined;
};
