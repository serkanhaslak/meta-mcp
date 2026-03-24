export const swaggerDarkCss = `
/* ── Dark theme for Swagger UI ── */
html { background: #09090b !important; }

body {
  background: #09090b !important;
  color: #e4e4e7 !important;
}

/* Top bar */
.swagger-ui .topbar {
  background: #131316 !important;
  border-bottom: 1px solid #27272a;
  padding: 8px 0;
}
.swagger-ui .topbar .download-url-wrapper .select-label select {
  background: #1a1a1f;
  color: #e4e4e7;
  border: 1px solid #3f3f46;
  border-radius: 6px;
}
.swagger-ui .topbar .download-url-wrapper .download-url-button {
  background: #3b82f6;
  border-radius: 6px;
}
.swagger-ui .topbar a { display: none; }

/* Info section */
.swagger-ui .info { margin: 30px 0 20px !important; }
.swagger-ui .info .title { color: #fafafa !important; }
.swagger-ui .info .title small { background: #3b82f6 !important; border-radius: 6px; }
.swagger-ui .info .title small.version-stamp { background: #3b82f620 !important; color: #3b82f6 !important; border: 1px solid #3b82f640; }
.swagger-ui .info p, .swagger-ui .info li { color: #a1a1aa !important; }
.swagger-ui .info a { color: #60a5fa !important; }
.swagger-ui .info .base-url { color: #71717a !important; }

/* Markdown */
.swagger-ui .renderedMarkdown p { color: #a1a1aa !important; }

/* Scheme container */
.swagger-ui .scheme-container {
  background: #131316 !important;
  border: 1px solid #27272a;
  border-radius: 12px;
  box-shadow: none !important;
  padding: 12px 20px;
  margin: 0 0 20px;
}

/* Tag groups */
.swagger-ui .opblock-tag {
  color: #fafafa !important;
  border-bottom: 1px solid #27272a !important;
}
.swagger-ui .opblock-tag:hover { background: #131316 !important; }
.swagger-ui .opblock-tag small { color: #71717a !important; }
.swagger-ui .opblock-tag svg { fill: #71717a !important; }

/* Operation blocks */
.swagger-ui .opblock {
  border-radius: 10px !important;
  border: 1px solid #27272a !important;
  box-shadow: none !important;
  margin-bottom: 8px !important;
  background: #131316 !important;
}
.swagger-ui .opblock .opblock-summary {
  border-bottom: none !important;
  padding: 8px 16px !important;
}
.swagger-ui .opblock .opblock-summary-description { color: #a1a1aa !important; }

/* Method colors */
.swagger-ui .opblock.opblock-get {
  background: #131316 !important;
  border-color: #22c55e40 !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary-method { background: #22c55e !important; border-radius: 6px !important; }
.swagger-ui .opblock.opblock-get .opblock-summary { border-color: transparent !important; }

.swagger-ui .opblock.opblock-post {
  background: #131316 !important;
  border-color: #3b82f640 !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3b82f6 !important; border-radius: 6px !important; }
.swagger-ui .opblock.opblock-post .opblock-summary { border-color: transparent !important; }

.swagger-ui .opblock.opblock-put {
  background: #131316 !important;
  border-color: #f59e0b40 !important;
}
.swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b !important; border-radius: 6px !important; }
.swagger-ui .opblock.opblock-put .opblock-summary { border-color: transparent !important; }

.swagger-ui .opblock.opblock-delete {
  background: #131316 !important;
  border-color: #ef444440 !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444 !important; border-radius: 6px !important; }
.swagger-ui .opblock.opblock-delete .opblock-summary { border-color: transparent !important; }

/* Expanded operation */
.swagger-ui .opblock.is-open .opblock-summary { border-bottom: 1px solid #27272a !important; }
.swagger-ui .opblock-body { background: #0d0d10 !important; }
.swagger-ui .opblock-body pre.microlight {
  background: #09090b !important;
  border: 1px solid #27272a !important;
  border-radius: 8px !important;
  color: #d4d4d8 !important;
  font-size: 12px !important;
}

/* Parameters */
.swagger-ui .opblock-section-header {
  background: #0d0d10 !important;
  border-bottom: 1px solid #27272a !important;
  box-shadow: none !important;
}
.swagger-ui .opblock-section-header h4 { color: #e4e4e7 !important; }
.swagger-ui .parameters-col_description p { color: #a1a1aa !important; }
.swagger-ui .parameter__name { color: #fafafa !important; }
.swagger-ui .parameter__name.required::after { color: #ef4444 !important; }
.swagger-ui .parameter__type { color: #71717a !important; }

/* Tables */
.swagger-ui table thead tr td, .swagger-ui table thead tr th {
  color: #a1a1aa !important;
  border-bottom: 1px solid #27272a !important;
}
.swagger-ui table tbody tr td { color: #d4d4d8 !important; border-bottom: 1px solid #1a1a1f !important; }
.swagger-ui .response-col_status { color: #e4e4e7 !important; }
.swagger-ui .response-col_description p { color: #a1a1aa !important; }

/* Inputs */
.swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
  background: #09090b !important;
  color: #e4e4e7 !important;
  border: 1px solid #3f3f46 !important;
  border-radius: 6px !important;
}
.swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
  border-color: #3b82f6 !important;
  outline: none !important;
  box-shadow: 0 0 0 2px #3b82f620 !important;
}

/* Buttons */
.swagger-ui .btn {
  border-radius: 6px !important;
  box-shadow: none !important;
}
.swagger-ui .btn.execute {
  background: #3b82f6 !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
}
.swagger-ui .btn.execute:hover { background: #2563eb !important; }
.swagger-ui .btn.authorize {
  color: #22c55e !important;
  border-color: #22c55e !important;
}
.swagger-ui .btn.authorize svg { fill: #22c55e !important; }

/* Models section */
.swagger-ui section.models {
  border: 1px solid #27272a !important;
  border-radius: 12px !important;
  background: #131316 !important;
}
.swagger-ui section.models h4 { color: #e4e4e7 !important; border-bottom: 1px solid #27272a; }
.swagger-ui .model-container { background: #0d0d10 !important; }
.swagger-ui .model { color: #d4d4d8 !important; }
.swagger-ui .model-title { color: #fafafa !important; }
.swagger-ui .model .property.primitive { color: #a1a1aa !important; }
.swagger-ui .prop-type { color: #60a5fa !important; }

/* Authorize dialog */
.swagger-ui .dialog-ux .modal-ux {
  background: #131316 !important;
  border: 1px solid #27272a !important;
  border-radius: 14px !important;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important;
}
.swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #27272a !important; }
.swagger-ui .dialog-ux .modal-ux-header h3 { color: #fafafa !important; }
.swagger-ui .dialog-ux .modal-ux-content p { color: #a1a1aa !important; }
.swagger-ui .dialog-ux .modal-ux-content h4 { color: #e4e4e7 !important; }

/* Response */
.swagger-ui .responses-inner { background: transparent !important; }
.swagger-ui .response-control-media-type__accept-message { color: #22c55e !important; }

/* Loading */
.swagger-ui .loading-container .loading::after { color: #71717a !important; }

/* Scrollbar */
.swagger-ui ::-webkit-scrollbar { width: 6px; height: 6px; }
.swagger-ui ::-webkit-scrollbar-track { background: #09090b; }
.swagger-ui ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
.swagger-ui ::-webkit-scrollbar-thumb:hover { background: #52525b; }

/* Links */
.swagger-ui a { color: #60a5fa !important; }

/* Server select dropdown */
.swagger-ui .servers > label select {
  background: #09090b !important;
  color: #e4e4e7 !important;
  border: 1px solid #3f3f46 !important;
  border-radius: 6px !important;
}

/* Copy button */
.swagger-ui .copy-to-clipboard { background: #1a1a1f !important; border-radius: 6px !important; }
.swagger-ui .copy-to-clipboard button { background: transparent !important; }

/* Wrapper */
.swagger-ui .wrapper {
  max-width: 960px !important;
  padding: 0 20px !important;
}
`;
