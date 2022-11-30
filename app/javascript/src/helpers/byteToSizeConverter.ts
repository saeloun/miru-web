export const bytesToSize = bytes => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "n/a";
  const amt = Math.floor(Math.log(bytes) / Math.log(1024));
  const i = parseInt(amt.toString(), 10);
  if (i === 0) return `${bytes} ${sizes[i]})`;

  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};
