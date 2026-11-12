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

// Mélange non biaisé (Fisher-Yates) : l'ordre initial ne doit pas influencer le classement
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const RankingField = ({ label, options = [], value, onChange, required }) => {
  const [rankedOptions, setRankedOptions] = useState(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      return [...value];
    }
    return shuffleArray(options);
  });

  const hasValue = Array.isArray(value) && value.length > 0;

  // Tant que le parent n'a pas d'ordre enregistré (montage, remise à zéro du formulaire),
  // lui communiquer l'ordre affiché : sinon un classement non modifié serait envoyé vide.
  useEffect(() => {
    if (!hasValue && onChange && rankedOptions.length > 0) {
      onChange({ label, rankings: rankedOptions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValue, rankedOptions]);

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
