import { renderDesignPreview } from "../../lib/design-preview";

export function GET() {
  return renderDesignPreview("/");
}
