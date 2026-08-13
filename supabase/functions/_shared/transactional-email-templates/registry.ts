import type * as React from 'npm:react@18.3.1'
import { template as originalsOrderConfirmation } from './originals-order-confirmation.tsx'

export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'originals-order-confirmation': originalsOrderConfirmation,
}
