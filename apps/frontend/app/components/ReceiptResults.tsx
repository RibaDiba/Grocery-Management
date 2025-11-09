interface ReceiptItem {
  name?: string;
  item_name?: string;
  expiration_range?: string;
  price?: string;
}

interface ReceiptResultsProps {
  items: ReceiptItem[];
}

export default function ReceiptResults({ items }: ReceiptResultsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full">
      <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">Extracted Items</h2>
      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
            <div className="text-black dark:text-zinc-50">
              <p className="font-medium">{item.name || item.item_name}</p>
              {item.expiration_range && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Expiration: {item.expiration_range} days
                </p>
              )}
              {item.price && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Price: {item.price}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

