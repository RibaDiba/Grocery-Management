interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 ${className}`}
    />
  );
}

export function IngredientSkeleton() {
  return (
    <div className="mt-6 w-full">
      <div 
        className="rounded-lg p-3 bg-gray-50"
        style={{
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="w-4 h-4" />
        </div>
        
        {/* Ingredient Cards */}
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div 
              key={item}
              className="flex flex-col gap-2 p-2 rounded-md bg-gray-100"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}