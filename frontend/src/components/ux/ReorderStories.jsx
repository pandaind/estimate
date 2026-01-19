import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

/**
 * SortableStory Component
 * Individual draggable story item
 */
const SortableStory = ({ story, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <FontAwesomeIcon icon={faGripVertical} className="w-5 h-5" />
        </div>

        {/* Order Number */}
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
          {index + 1}
        </div>

        {/* Story Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {story.title}
          </h4>
          {story.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {story.description}
            </p>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-2">
          {story.finalEstimate && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
              {story.finalEstimate}
            </span>
          )}
          {story.status === 'COMPLETED' && (
            <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          {story.priority && (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                story.priority === 'CRITICAL'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : story.priority === 'HIGH'
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : story.priority === 'MEDIUM'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {story.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ReorderStories Component
 * Drag-and-drop interface for reordering stories
 */
const ReorderStories = ({ stories = [], onReorder, onSave }) => {
  const [items, setItems] = useState(stories);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        onReorder?.(newItems);
        return newItems;
      });
    }
  };

  const handleSave = () => {
    onSave?.(items.map((item) => item.id));
    setHasChanges(false);
  };

  const handleReset = () => {
    setItems(stories);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reorder Stories
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag and drop stories to change their order
          </p>
        </div>

        {hasChanges && (
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Order
            </button>
          </div>
        )}
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
        >
          <p className="text-sm text-blue-800 dark:text-blue-300">
            You have unsaved changes. Click "Save Order" to apply the new story order.
          </p>
        </motion.div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((story, index) => (
              <SortableStory key={story.id} story={story} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No stories to reorder
        </div>
      )}
    </div>
  );
};

export default ReorderStories;
