
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { X } from "lucide-react";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onRemove: () => void;
}

const SortableItem = ({ id, children, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 mb-2 bg-white rounded-lg border border-gray-200 shadow-sm group"
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1">{children}</span>
      <button
        type="button"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface DraggableAttributesProps {
  attributes: string[];
  onChange: (newAttributes: string[]) => void;
}

export function DraggableAttributes({ attributes, onChange }: DraggableAttributesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = attributes.indexOf(active.id as string);
      const newIndex = attributes.indexOf(over.id as string);
      onChange(arrayMove(attributes, oldIndex, newIndex));
    }
  };

  const handleRemove = (attribute: string) => {
    onChange(attributes.filter(attr => attr !== attribute));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={attributes}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {attributes.map((attribute) => (
            <SortableItem 
              key={attribute} 
              id={attribute}
              onRemove={() => handleRemove(attribute)}
            >
              {attribute}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
