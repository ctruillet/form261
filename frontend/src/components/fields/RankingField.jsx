// components/fields/RankingField.jsx
import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableItem = ({ id, index, option }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px",
    // margin: "4px 0",
    backgroundColor: "#f1f1f1",
    border: "1px solid #ccc",
    cursor: "pointer",
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {index + 1}. {option}
    </li>
  );
};

const RankingField = ({ label, options, onChange }) => {
  const [rankedOptions, setRankedOptions] = useState(options);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = rankedOptions.indexOf(active.id);
      const newIndex = rankedOptions.indexOf(over.id);

      const updatedOptions = arrayMove(rankedOptions, oldIndex, newIndex);
      setRankedOptions(updatedOptions);
      onChange({ label, rankings: updatedOptions });
    }
  };

  return (
    <div className="ranking-field">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={rankedOptions}
          strategy={verticalListSortingStrategy}
        >
          <ul className="ranking-list">
            {rankedOptions.map((option, index) => (
              <SortableItem key={option} id={option} index={index} option={option} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default RankingField;
