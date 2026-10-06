// One timestamp per build (YYYYMMDDHHMMSS), shared by every page and written
// into <meta name="build"> so a served page can be matched to the build that
// produced it. Evaluated once, when the module is first imported.
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");

export const BUILD_STAMP =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
