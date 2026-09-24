import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react';

export const LayersPanel = ({ elements, selectedId, onSelect, onUpdate, onReorder }) => {
  const [draggedId, setDraggedId] = useState(null);

  // Sort elements by zIndex (high to low) for list view
  const sortedElements = [...elements].sort(
    (a, b) => (b.style?.zIndex || 0) - (a.style?.zIndex || 0)
  );

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    // Create a copy of the sorted list
    const newList = [...sortedElements];
    const sourceIndex = newList.findIndex((el) => el.id === draggedId);
    const targetIndex = newList.findIndex((el) => el.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Reorder in local list
    const [movedItem] = newList.splice(sourceIndex, 1);
    newList.splice(targetIndex, 0, movedItem);

    // Re-assign z-indexes based on new order
    // Top of list = Highest Z-Index = elements.length
    // Bottom of list = Lowest Z-Index = 1
    const total = elements.length;
    const reorderedElements = newList.map((el, index) => ({
      ...el,
      style: {
        ...el.style,
        zIndex: total - index,
      },
    }));

    if (onReorder) {
      onReorder(reorderedElements);
    }

    setDraggedId(null);
  };

  const moveLayer = (id, direction) => {
    // Find current index
    const currentIndex = sortedElements.findIndex((e) => e.id === id);
    if (currentIndex === -1) return;

    // Moving UP in list (visual) means Higher Z-index?
    // Wait, list is High to Low.
    // So Top of list is Z-Index MAX.
    // "Bring Forward" means increasing Z-Index -> Moving towards Top of List (Index 0).
    // "Send Backward" means decreasing Z-Index -> Moving towards Bottom of List.

    // If direction is 1 (Bring Forward), we want to swap with the item above (index - 1).
    // If direction is -1 (Send Backward), we want to swap with item below (index + 1).

    // Map button direction to list index direction
    const listSwapDir = direction === 1 ? -1 : 1;

    const targetIndex = currentIndex + listSwapDir;

    if (targetIndex < 0 || targetIndex >= sortedElements.length) return;

    // Perform swap in sorting logic manually effectively
    // Or easier: just call handleDrop logic manually
    const targetId = sortedElements[targetIndex].id;

    // Reuse drop logic basically
    const fakeEvent = { preventDefault: () => {} };
    // We set draggedId temporarily to act as source
    setDraggedId(id);
    // Wait, we need to bypass the state update lag if we reuse handleDrop directly?
    // Better to extract reorder logic.

    const newList = [...sortedElements];
    const [movedItem] = newList.splice(currentIndex, 1);
    newList.splice(targetIndex, 0, movedItem);

    const total = elements.length;
    const reorderedElements = newList.map((el, index) => ({
      ...el,
      style: {
        ...el.style,
        zIndex: total - index,
      },
    }));

    if (onReorder) onReorder(reorderedElements);
    setDraggedId(null);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center">
          <Layers size={16} className="mr-2" /> Layers
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedElements.map((el, index) => {
          const isSelected = selectedId === el.id;
          const isBeingDragged = draggedId === el.id;

          return (
            <div
              key={el.id}
              draggable
              onDragStart={(e) => handleDragStart(e, el.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, el.id)}
              onClick={() => onSelect(el.id)}
              className={`flex items-center p-2 rounded cursor-pointer border transition-colors ${
                isBeingDragged
                  ? 'opacity-50 border-dashed border-gray-400 bg-gray-50'
                  : isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="mr-2 cursor-grab active:cursor-grabbing text-gray-400">
                <GripVertical size={14} />
              </div>

              <div className="flex items-center space-x-2 flex-1 min-w-0 select-none">
                <span className="text-xs font-mono text-gray-400 w-4 text-center">
                  {el.style?.zIndex || 0}
                </span>
                <div className="truncate text-sm text-gray-700 font-medium">
                  {el.type === 'image'
                    ? el.field
                      ? el.label || el.field.split('.').pop()
                      : 'Image'
                    : el.content || el.type}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(el.id, 1);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Bring Forward"
                >
                  ▲
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(el.id, -1);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Send Backward"
                >
                  ▼
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ ...el, locked: !el.locked });
                  }}
                  className={`p-1 ${
                    el.locked ? 'text-orange-500' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
            </div>
          );
        })}

        {elements.length === 0 && (
          <div className="text-center text-gray-400 text-xs py-10">No elements</div>
        )}
      </div>
    </div>
  );
};
