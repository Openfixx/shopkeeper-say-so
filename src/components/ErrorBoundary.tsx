export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) return <div>Error: {error.message}</div>;
  return <>{children}</>;
}
