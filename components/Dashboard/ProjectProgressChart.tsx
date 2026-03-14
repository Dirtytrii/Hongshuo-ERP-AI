import React from 'react';
import { Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Project } from '../../types';

interface ProjectProgressChartProps {
  projects: Project[];
  onProjectClick?: (projectId: number) => void;
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects, onProjectClick }) => {
  const maxNameLen = projects.length > 5 ? 8 : 10;
  const chartData = projects.map((project) => ({
    name: project.name.length > maxNameLen ? project.name.substring(0, maxNameLen) + '...' : project.name,
    fullName: project.name,
    projectId: project.id,
    进度: project.progress,
    状态: project.status,
  }));
  const chartHeight = Math.min(500, Math.max(250, projects.length * 32));

  const getStatusColor = (status: string) => {
    switch (status) {
      case '施工中':
        return '#3b82f6'; // blue
      case '验收中':
        return '#a855f7'; // purple
      case '已完工':
        return '#10b981'; // green
      default:
        return '#64748b'; // slate
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Building2 size={18} />
        项目进度概览
      </h3>
      {projects.length === 0 ? (
        <div className="text-center text-slate-400 py-8">暂无项目数据</div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            <div style={{ height: chartHeight, minHeight: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, '进度']}
                    labelFormatter={(label) => {
                      const project = chartData.find((p) => p.name === label);
                      return project?.fullName || label;
                    }}
                  />
                  <Bar
                    dataKey="进度"
                    radius={[0, 8, 8, 0]}
                    onClick={(data: { projectId?: number }) =>
                      data?.projectId != null && onProjectClick?.(data.projectId)
                    }
                    cursor={onProjectClick ? 'pointer' : undefined}
                  >
                    {chartData.map((entry, index) => {
                      const project = projects[index];
                      return <Cell key={`cell-${index}`} fill={getStatusColor(project.status)} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-slate-600">施工中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-slate-600">验收中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-slate-600">已完工</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgressChart;
