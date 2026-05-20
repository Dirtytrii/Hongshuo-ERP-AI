import React from 'react';
import { X } from 'lucide-react';

interface RejectNoteModalProps {
  rejectNote: string;
  onRejectNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const RejectNoteModal: React.FC<RejectNoteModalProps> = ({ rejectNote, onRejectNoteChange, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-6 flex items-center justify-between text-white bg-red-600">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <X size={20} />
          拒绝原因
        </h3>
        <button type="button" onClick={onCancel} className="hover:rotate-90 transition-transform" aria-label="关闭">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="reject-note" className="block text-sm font-bold text-slate-700 mb-2">
            请输入拒绝原因（可选）
          </label>
          <textarea
            id="reject-note"
            value={rejectNote}
            onChange={(event) => onRejectNoteChange(event.target.value)}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            rows={4}
            placeholder="请输入拒绝原因..."
          />
        </div>
      </div>
      <div className="p-6 border-t flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border font-bold hover:bg-slate-50 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-transform active:scale-95"
        >
          确认拒绝
        </button>
      </div>
    </div>
  </div>
);

export default RejectNoteModal;
