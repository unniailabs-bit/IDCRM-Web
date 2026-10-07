import React, { useState, useEffect } from 'react';
import { FilePlus, Trash2, FolderOpen, X, Check, Edit2, Loader2 } from 'lucide-react';
import { loadTemplates, saveTemplateRemote, deleteTemplateRemote, normalizeTemplate } from '../templateStorage';

export const TemplateManager = ({
  isOpen,
  onClose,
  onLoadTemplate,
  currentTemplateId,
  onTemplateRenamed,
}) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  const refresh = async () => {
    setIsLoading(true);
    setError('');
    try {
      setTemplates(await loadTemplates());
    } catch (e) {
      console.error('Failed to load templates', e);
      setError('Could not load templates from the server. Please try again.');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await deleteTemplateRemote(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      // If we deleted the current template the editor keeps it as an unsaved copy;
      // saving it again recreates it.
    } catch (err) {
      console.error('Failed to delete template', err);
      alert('Failed to delete the template. Please try again.');
    }
  };

  const handleStartEdit = (t, e) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditName(t.name);
  };

  const handleSaveName = async (e) => {
    e.stopPropagation();
    const name = editName.trim();
    if (!name) return;
    const target = templates.find((t) => t.id === editingId);
    if (!target) return;

    try {
      const saved = await saveTemplateRemote({ ...target, name });
      setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      if (saved.id === currentTemplateId && onTemplateRenamed) onTemplateRenamed(saved.name);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to rename template', err);
      alert('Failed to rename the template. Please try again.');
    }
  };

  const handleCreateNew = async () => {
    const name = prompt('Enter name for new template:', 'New Template');
    if (!name || !name.trim()) return;

    try {
      const saved = await saveTemplateRemote(
        normalizeTemplate({
          id: crypto.randomUUID(),
          name: name.trim(),
          elements: [],
          orientation: 'horizontal',
        })
      );
      setTemplates((prev) => [saved, ...prev]);
      onLoadTemplate(saved);
      onClose();
    } catch (err) {
      console.error('Failed to create template', err);
      alert('Failed to create the template. Please try again.');
    }
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
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span>Loading templates...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p>{error}</p>
              <button onClick={refresh} className="mt-3 text-sm text-blue-600 hover:underline">
                Retry
              </button>
            </div>
          ) : templates.length === 0 ? (
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
                  className={`group p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-200 ${currentTemplateId === t.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'border-gray-200 bg-white'}`}
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
                          {new Date(t.lastModified).toLocaleDateString()} at {new Date(t.lastModified).toLocaleTimeString()} • {t.orientation} • {t.cardWidthMm || 85.6}×{t.cardHeightMm || 54} mm
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
