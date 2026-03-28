import { Modal } from '@/components/ui/Modal.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { TextField, SelectField } from '@/components/ui/TextField.jsx';
import { BLOCK_TYPES } from '@/domain/schedule/constants.js';
import { api } from '@/services/api/index.js';

/**
 * @param {object} props
 * @param {object | null} props.editing - block shape or draft with id 'new'
 * @param {() => void} props.onClose
 * @param {string | null} props.userId
 * @param {object[]} props.blocks
 * @param {(blocks: object[] | ((p: object[]) => object[])) => void} props.onBlocksChange
 */
export function BlockEditorModal({
  editing,
  onClose,
  userId,
  blocks,
  onBlocksChange,
  onDraftChange,
}) {
  if (!editing) return null;

  const isNew = editing.id === 'new';

  const persistEdit = async () => {
    if (!userId || isNew) return;
    try {
      const payload = {
        day: editing.day,
        startMinutes: editing.startMinutes,
        endMinutes: editing.endMinutes,
        type: editing.type,
        title: editing.title,
        reminderEnabled: editing.reminderEnabled,
      };
      await api.updateBlock(editing.id, payload);
      onBlocksChange(
        blocks.map((b) => (b.id === editing.id ? { ...b, ...payload } : b))
      );
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBlock = async () => {
    if (!userId || isNew) return;
    try {
      await api.deleteBlock(editing.id);
      onBlocksChange(blocks.filter((x) => x.id !== editing.id));
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const createBlock = async () => {
    if (!userId || !isNew) return;
    try {
      const created = await api.createBlock(userId, {
        day: editing.day,
        startMinutes: editing.startMinutes,
        endMinutes: editing.endMinutes,
        type: editing.type,
        title: editing.title,
        reminderEnabled: editing.reminderEnabled,
      });
      onBlocksChange([
        ...blocks,
        {
          id: created.id,
          day: created.day,
          startMinutes: created.startMinutes,
          endMinutes: created.endMinutes,
          type: created.type,
          title: created.title,
          reminderEnabled: created.reminderEnabled,
        },
      ]);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal open={Boolean(editing)} onClose={onClose}>
      <h3 className="font-display text-lg font-semibold">
        {isNew ? 'New block' : 'Edit block'}
      </h3>
      <TextField
        label="Title"
        value={editing.title}
        onChange={(e) => onDraftChange({ ...editing, title: e.target.value })}
        className="mt-4"
      />
      <SelectField
        label="Type"
        value={editing.type}
        onChange={(e) => onDraftChange({ ...editing, type: e.target.value })}
        className="mt-3"
      >
        {Object.values(BLOCK_TYPES).map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </SelectField>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          className="rounded border-white/20 bg-black/40"
          checked={editing.reminderEnabled}
          onChange={(e) =>
            onDraftChange({ ...editing, reminderEnabled: e.target.checked })
          }
        />
        Enable reminder
      </label>
      <div className="mt-6 flex flex-wrap gap-2 justify-end">
        {!isNew && (
          <Button variant="danger" size="md" type="button" onClick={deleteBlock}>
            Delete
          </Button>
        )}
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={isNew ? createBlock : persistEdit}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
