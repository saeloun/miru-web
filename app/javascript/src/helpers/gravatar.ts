const DEFAULT_AVATAR_PATTERNS = [
  /(?:^|\/)avatar(?:-[^/?]+)?\.svg(?:[?#].*)?$/i,
  /(?:^|\/)user_avatar(?:-[^/?]+)?\.svg(?:[?#].*)?$/i,
];

const isPlaceholderAvatar = (avatarUrl?: string | null) =>
  !avatarUrl ||
  DEFAULT_AVATAR_PATTERNS.some(pattern => pattern.test(avatarUrl));

export const getDisplayAvatarUrl = (
  avatarUrl?: string | null,
  _email?: string | null,
  _size: number = 80
) => {
  if (!isPlaceholderAvatar(avatarUrl)) {
    return avatarUrl;
  }

  return avatarUrl || undefined;
};
