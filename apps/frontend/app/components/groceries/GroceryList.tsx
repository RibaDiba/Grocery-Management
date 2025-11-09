import GroceryListItem from './GroceryListItem';

interface GroceryItem {
  id: number;
  name: string;
  completed: boolean;
}

interface GroceryListProps {
  items: GroceryItem[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function GroceryList({ items, onToggle, onRemove }: GroceryListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-8 w-full space-y-4">
      {items.map((item) => (
        <GroceryListItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}


