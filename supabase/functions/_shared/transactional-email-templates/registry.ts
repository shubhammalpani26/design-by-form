import type * as React from 'npm:react@18.3.1'
import { template as originalsOrderConfirmation } from './originals-order-confirmation.tsx'
import { template as originalsOrderShipped } from './originals-order-shipped.tsx'
import { template as originalsReviewRequest } from './originals-review-request.tsx'
import { template as fulfillmentFailed } from './fulfillment-failed.tsx'

export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'originals-order-confirmation': originalsOrderConfirmation,
  'originals-order-shipped': originalsOrderShipped,
  'originals-review-request': originalsReviewRequest,
  'fulfillment-failed': fulfillmentFailed,
}
