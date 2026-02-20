import React from 'react';
import { Clock, Check, X } from 'lucide-react';
import { Milestone } from '../../types';

interface MilestoneListProps {
  projectId: number;
  milestones: Milestone[];
}

const MilestoneList: React.FC<MilestoneListProps> = ({ projectId, milestones }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Clock size={18} />
        项目里程碑
      </h3>
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center text-slate-400 py-8">暂无里程碑</div>
        ) : (
          milestones.map(milestone => (
            <div key={milestone.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex-1">
                <p className="font-medium text-slate-700">{milestone.name}</p>
                <p className="text-sm text-slate-500 mt-1">{milestone.description || '无描述'}</p>
                <p className="text-xs text-slate-400 mt-1">计划日期: {milestone.planDate || milestone.dueDate || '未设置'}</p>
              </div>
              <div className="ml-4">
                {milestone.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                    <Check size={14} /> 已完成
                  </span>
                ) : milestone.status === 'in_progress' ? (
                  <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-bold">
                    <Clock size={14} /> 进行中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">
                    <X size={14} /> 未开始
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MilestoneList;

