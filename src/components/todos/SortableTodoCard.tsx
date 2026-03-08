import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMenu } from "react-icons/fi";

type SortableTodoCardProps = {
  id: string;
  children: React.ReactNode;
};

export default function SortableTodoCard({ id, children }: SortableTodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-4 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-500 transition hover:text-slate-300 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <FiMenu aria-hidden />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
