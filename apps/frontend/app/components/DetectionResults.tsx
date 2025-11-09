interface DetectionResult {
  total_objects: number;
  processing_time_ms: number;
}

interface DetectionResultsProps {
  result: DetectionResult;
}

export default function DetectionResults({ result }: DetectionResultsProps) {
  return (
    <div className="mt-8 w-full">
      <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">Detection Results</h2>
      <div className="mt-4 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
        <div className="text-black dark:text-zinc-50">
          <p className="text-3xl font-bold mb-2">{result.total_objects}</p>
          <p className="text-lg mb-1">Total Objects Detected</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Processing time: {result.processing_time_ms}ms
          </p>
        </div>
      </div>
    </div>
  );
}

