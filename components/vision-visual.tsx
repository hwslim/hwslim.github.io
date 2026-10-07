export function VisionVisual({ caption }: { caption: string }) {
  return <svg className="vision-visual" viewBox="0 0 480 430" role="img" aria-label={caption}>
    <defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" /></pattern></defs>
    <rect x="10" y="10" width="460" height="410" rx="4" fill="url(#grid)" />
    <ellipse className="visual-orbit" cx="246" cy="220" rx="168" ry="146" fill="none" strokeDasharray="4 9" />
    <path className="visual-frame" d="M100 151V104H147 M331 104H378V151 M378 290V337H331 M147 337H100V290" fill="none" />
    <path className="visual-rays" d="M46 281L203 134 M46 281L291 164 M46 281L291 263 M46 281L203 294" fill="none" />
    <path className="visual-cube-back" d="M203 134L291 164L291 263L203 232Z M203 134L150 194 M203 232L150 294" fill="none" />
    <path className="visual-cube" d="M150 194L239 224L291 164L203 134Z M150 194V294L239 326L291 263V164 M239 224V326" />
    <path className="visual-arm" d="M408 349L347 279L304 321L239 268" fill="none" />
    <g className="visual-joints"><circle cx="408" cy="349" r="12" /><circle cx="347" cy="279" r="11" /><circle cx="304" cy="321" r="11" /><circle cx="239" cy="268" r="8" /></g>
    <g className="visual-points"><circle cx="203" cy="134" r="4" /><circle cx="291" cy="164" r="4" /><circle cx="150" cy="194" r="4" /><circle cx="239" cy="224" r="4" /><circle cx="239" cy="326" r="4" /><circle cx="150" cy="294" r="4" /></g>
    <circle className="visual-camera" cx="46" cy="281" r="9" />
  </svg>;
}
