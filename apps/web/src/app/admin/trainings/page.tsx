'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';

interface TrainingCategory {
  id: string;
  name: string;
}

export default function TrainingsPage() {
  const toast = useToast();
  const [trainings, setTrainings] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<TrainingCategory | null>(null);

  const [name, setName] = useState('');
  const [editName, setEditName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<TrainingCategory | null>(null);

  const fetchTrainings = useCallback(async () => {
    try {
      const res = await (api.trainings.getAll() as Promise<{ data: TrainingCategory[] }>);
      setTrainings(res.data || []);
    } catch {
      toast.error('Failed to load training categories.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.trainings.create({ name });
      setName('');
      setShowAdd(false);
      toast.success(`"${name}" added to training categories.`);
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create training category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await api.trainings.update(editTarget.id, { name: editName });
      setShowEdit(false);
      setEditTarget(null);
      toast.success('Training category updated.');
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update training category');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (training: TrainingCategory) => {
    setEditTarget(training);
    setEditName(training.name);
    setShowEdit(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.trainings.delete(confirmDelete.id);
      toast.success(`"${confirmDelete.name}" deleted.`);
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete training category');
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add and manage training categories available in the system
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-[#0f3460] hover:bg-[#0a2540] text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Training
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Training Category
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Actions
            </span>
          </div>

          {/* Rows */}
          {trainings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No training categories yet. Add one to get started.
            </div>
          ) : (
            trainings.map((training, idx) => (
              <div
                key={training.id}
                className={`grid grid-cols-[1fr_auto] items-center px-5 py-4 ${
                  idx < trainings.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-[#0891b2] flex-shrink-0" />
                  <span className="text-sm text-gray-800">{training.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(training)}
                    className="text-gray-400 hover:text-[#0891b2] p-1 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(training)}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Training Category"
        subtitle="Create a new training category available in the system."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trainingName">Training Name</Label>
            <Input
              id="trainingName"
              placeholder="e.g. Confined Space Entry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Training'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Training Category"
        subtitle="Update the training name."
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editName">Training Name</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0f3460] hover:bg-[#0a2540]"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Training Category"
        message={`"${confirmDelete?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
