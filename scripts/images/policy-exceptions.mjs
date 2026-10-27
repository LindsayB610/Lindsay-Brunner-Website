// Exact AST sites only. A second occurrence or altered expression fails closed.
// Adapter entries are added only after reviewing the task03 implementation.
export const exceptions = [
  {file:'src/components/responsive-image.tsx', symbol:'ResponsiveImage', kind:'raw-jsx-image', code:'<img {...props} src={image.src} srcSet={image.webpSrcSet} sizes={image.sizes} loading={image.loading} fetchPriority={image.fetchPriority} width={props.width ?? image.width} height={props.height ?? image.height} data-image-source={image.sourceUrl} data-image-profile={profile} />', reason:'Single React adapter; resolver descriptor overrides caller source props.'},
  {file:'src/lib/responsive-image.ts', symbol:'setResponsiveImage', kind:'source-write', code:'image.srcset = descriptor.webpSrcSet', reason:'Shared resolver descriptor; stale picture sources cleared first.'},
  {file:'src/lib/responsive-image.ts', symbol:'setResponsiveImage', kind:'source-write', code:'image.src = descriptor.src', reason:'Shared resolver descriptor; srcset applied first.'},
  {file:'static/js/image-dialog.js', symbol:'openOriginal', kind:'source-write', code:'image.src = url.href', reason:'Local original on explicit interaction; stale responsive attributes cleared first.'},
  {file:'src/react/ai-chat-exporter.tsx', symbol:'AiChatExporterPage', kind:'source-write', code:'script.src = turnstileScriptUrl', reason:'Existing Turnstile script loader; this is not an image node.'},
];
