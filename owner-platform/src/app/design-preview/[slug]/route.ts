import { renderDesignPreview } from "../../../lib/design-preview";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return renderDesignPreview(`/${slug}`);
}
