/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit resolves its built-in standard fonts (Helvetica etc.) via a
  // package.json "imports" subpath map (#standard-fonts/*) pointing at .cjs
  // files under js/standard-fonts, plus the .afm metrics data those load
  // from js/data. Vercel's build-time file tracing doesn't pick these up
  // automatically since they're required indirectly through that imports
  // map rather than a plain static require, so the deployed function is
  // missing them at runtime. Explicitly include them for this route.
  experimental: {
    outputFileTracingIncludes: {
      "/api/reports/my-kpi": [
        "./node_modules/pdfkit/js/standard-fonts/*.cjs",
        "./node_modules/pdfkit/js/data/*.afm",
      ],
    },
  },
};
export default nextConfig;
