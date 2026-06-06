interface ScanRayProps {
  ray: 'r1' | 'r2'
}

export function ScanRay({ ray }: ScanRayProps) {
  return <div className={`lr-scan-ray ${ray}`} />
}
