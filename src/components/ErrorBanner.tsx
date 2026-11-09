export function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return <div role="alert" data-testid="error-banner" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>;
}
