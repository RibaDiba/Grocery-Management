import { Trash2 } from 'lucide-react';

interface GroceryItemData {
  id: number;
  name: string;
  completed: boolean;
}

interface GroceryListItemProps {
  item: GroceryItemData;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function GroceryListItem({
  item,
  onToggle,
  onRemove,
}: GroceryListItemProps) {
  return (
    <li className="flex items-center gap-3 p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        className="w-5 h-5 rounded cursor-pointer"
        aria-label={`Mark ${item.name} as ${item.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Item Name */}
      <span
        className={`flex-1 text-sm ${
          item.completed
            ? 'line-through text-gray-400'
            : 'text-gray-800'
        }`}
      >
        {item.name}
      </span>

      {/* Delete Button */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
        aria-label={`Delete ${item.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
