/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer's dependency chain (via @react-pdf/textkit ->
  // @react-pdf/hyphenate) has a package.json "exports" map that only
  // declares an "import" condition, no "require"/"default" one. Left as an
  // external package, Vercel's Node.js runtime does its own CommonJS
  // resolution against that map at request time and crashes with
  // ERR_PACKAGE_PATH_NOT_EXPORTED. Forcing these through webpack instead of
  // Node's runtime resolver avoids that entirely.
  transpilePackages: [
    "@react-pdf/renderer",
    "@react-pdf/textkit",
    "@react-pdf/hyphenate",
    "@react-pdf/pdfkit",
    "@react-pdf/font",
  ],
};
export default nextConfig;
