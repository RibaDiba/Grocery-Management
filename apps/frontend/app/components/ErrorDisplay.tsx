interface ErrorDisplayProps {
  error: string;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="mt-8 w-full">
      <div className="rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4">
        <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
}


