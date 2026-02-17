import SparkMD5 from "spark-md5";

/**
 * Generate a Gravatar URL from an email address
 * @param email - The email address to generate the Gravatar for
 * @param size - The size of the avatar in pixels (default: 80)
 * @param defaultImage - The default image to use if no Gravatar exists (default: 'mp' for mystery person)
 * @returns The Gravatar URL
 */
export const getGravatarUrl = (
  email: string,
  size: number = 80,
  defaultImage: string = "mp"
): string => {
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Generate MD5 hash using SparkMD5
  const hash = SparkMD5.hash(normalizedEmail);

  // Construct the Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
};
