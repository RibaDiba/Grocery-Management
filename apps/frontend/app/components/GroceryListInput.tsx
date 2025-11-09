interface GroceryListInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export default function GroceryListInput({ value, onChange, onAdd }: GroceryListInputProps) {
  return (
    <div className="mt-8 w-full">
      <div className="flex gap-4">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd();
            }
          }}
          placeholder="Add a new item"
          className="flex-grow rounded-full border border-solid border-black/[.08] px-5 py-3 text-black transition-colors focus:border-transparent focus:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:text-white dark:focus:bg-[#1a1a1a]"
        />
        <button
          onClick={onAdd}
          className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Add
        </button>
      </div>
    </div>
  );
}

