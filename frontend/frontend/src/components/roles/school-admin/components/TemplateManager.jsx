import React, { useState, useEffect } from 'react';
import { FilePlus, Trash2, FolderOpen, X, Check, Edit2 } from 'lucide-react';

export const TemplateManager = ({ isOpen, onClose, onLoadTemplate, currentTemplateId }) => {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('id_card_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      } else {
        setTemplates([]);
      }
    } catch (e) {
      console.error("Failed to load templates", e);
      setTemplates([]);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    
    const newTemplates = templates.filter(t => t.id !== id);
    localStorage.setItem('id_card_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
    
    // If we deleted the current template, we might need to handle that parent-side, 
    // but for now let's just leave the editor as is (it becomes "unsaved" effectively)
  };

  const handleStartEdit = (t, e) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditName(t.name);
  };

  const handleSaveName = (e) => {
    e.stopPropagation();
    const newTemplates = templates.map(t => 
      t.id === editingId ? { ...t, name: editName, lastModified: Date.now() } : t
    );
    localStorage.setItem('id_card_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
    setEditingId(null);
  };

  const handleCreateNew = () => {
    const name = prompt("Enter name for new template:", "New Template");
    if (!name) return;

    const newTemplate = {
      id: crypto.randomUUID(),
      name: name,
      elements: [],
      orientation: 'horizontal',
      created: Date.now(),
      lastModified: Date.now()
    };

    const newTemplates = [...templates, newTemplate];
    localStorage.setItem('id_card_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
    onLoadTemplate(newTemplate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FolderOpen size={20} className="text-blue-600"/>
            Manage Templates
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {templates.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No templates found.</p>
              <p className="text-sm mt-2">Create a new one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => { onLoadTemplate(t); onClose(); }}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 ${currentTemplateId === t.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex-1">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="px-2 py-1 border rounded text-sm w-full"
                          autoFocus
                        />
                        <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-100 rounded">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          {t.name}
                          <button 
                            onClick={(e) => handleStartEdit(t, e)} 
                            className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Rename"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(t.lastModified).toLocaleDateString()} at {new Date(t.lastModified).toLocaleTimeString()} • {t.orientation}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {currentTemplateId === t.id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Active</span>
                    )}
                    <button 
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FilePlus size={18} />
            <span>Create New Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};
