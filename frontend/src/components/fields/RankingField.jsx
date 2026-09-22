import React, { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Typography, List, ListItem } from "@mui/material";
import FormLabel from '@mui/material/FormLabel';

const SortableItem = ({ id, index, option }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "grab",
    marginBottom: "4px",
  };

  return (
    <ListItem ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Typography variant="body1">
        {index + 1}. {option}
      </Typography>
    </ListItem>
  );
};

const RankingField = ({ label, options = [], value, onChange, required }) => {
  const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

  const [rankedOptions, setRankedOptions] = useState(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      return [...value];
    }
    return shuffleArray(options);
  });

  // Notifier le parent de l'ordre initial s'il n'est pas encore défini
  useEffect(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      if (onChange && rankedOptions.length > 0) {
        onChange({ label, rankings: rankedOptions });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      setRankedOptions([...value]);
    }
  }, [value]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rankedOptions.indexOf(active.id);
      const newIndex = rankedOptions.indexOf(over.id);

      const updatedOptions = arrayMove(rankedOptions, oldIndex, newIndex);
      setRankedOptions(updatedOptions);
      if (onChange) {
        onChange({ label, rankings: updatedOptions });
      }
    }
  };

  return (
    <div className="ranking-field">
      <FormLabel component="legend" required={required}>
        {label}
      </FormLabel>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rankedOptions} strategy={verticalListSortingStrategy}>
          <List>
            {rankedOptions.map((option, index) => (
              <SortableItem key={option} id={option} index={index} option={option} />
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default RankingField;
