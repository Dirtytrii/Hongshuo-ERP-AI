import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { Project } from '../../types';
import ProjectManagementPage from './ProjectManagementPage';

vi.mock('../../utils/export', () => ({
  exportProjectsToExcel: vi.fn(),
  downloadProjectImportTemplate: vi.fn(),
}));

vi.mock('../ProjectDetail/ProjectDetail', () => ({
  default: ({
    project,
    onClose,
    onEdit,
    onDelete,
  }: {
    project: Project;
    onClose: () => void;
    onEdit?: (project: Project) => void;
    onDelete?: (projectId: number) => void;
  }) => (
    <div data-testid="project-detail">
      <h2>{project.name}</h2>
      <button type="button" onClick={onClose}>
        返回
      </button>
      {onEdit && (
        <button type="button" onClick={() => onEdit(project)}>
          编辑项目
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => onDelete(project.id)}>
          删除项目
        </button>
      )}
    </div>
  ),
}));

vi.mock('./ProjectKanban', () => ({
  default: ({ onSelect }: { onSelect: (projectId: number) => void }) => (
    <button type="button" data-testid="project-kanban" onClick={() => onSelect(1)}>
      mock-kanban
    </button>
  ),
}));

const project: Project = {
  id: 1,
  name: '宏硕总部改造',
  code: 'P-001',
  managerId: '李工',
  contractAmount: 1200000,
  receivedAmount: 300000,
  materialCost: 100000,
  laborCost: 80000,
  otherCost: 20000,
  status: '施工中',
  progress: 35,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  milestones: [],
};

type Props = ComponentProps<typeof ProjectManagementPage>;

function buildProps(overrides: Partial<Props> = {}): Props {
  return {
    projects: [project],
    selectedProjectId: null,
    selectedProjectDetail: null,
    financeRecords: [],
    stockLogs: [],
    inventory: [],
    projectViewMode: 'table',
    canCreateProject: true,
    canEditProject: true,
    canDeleteProject: true,
    onChangeViewMode: vi.fn(),
    onSelectProject: vi.fn(),
    onCloseDetail: vi.fn(),
    onOpenProjectModal: vi.fn(),
    onDeleteProject: vi.fn(),
    onRefreshMilestones: vi.fn(),
    onImportProjects: vi.fn(),
    ...overrides,
  };
}

describe('ProjectManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('列表模式渲染项目并在点击查看时回调项目 id', () => {
    const onSelectProject = vi.fn();
    render(<ProjectManagementPage {...buildProps({ onSelectProject })} />);

    expect(screen.getByText('宏硕总部改造')).toBeInTheDocument();
    expect(screen.getByText('P-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /查看/ }));
    expect(onSelectProject).toHaveBeenCalledWith(1);
  });

  it('点击看板视图按钮会切换到 kanban 模式', () => {
    const onChangeViewMode = vi.fn();
    render(<ProjectManagementPage {...buildProps({ onChangeViewMode })} />);

    fireEvent.click(screen.getByRole('button', { name: /看板/ }));
    expect(onChangeViewMode).toHaveBeenCalledWith('kanban');
  });

  it('无创建编辑删除权限时隐藏对应按钮，并默认不显示下载模板', () => {
    render(
      <ProjectManagementPage
        {...buildProps({
          canCreateProject: false,
          canEditProject: false,
          canDeleteProject: false,
        })}
      />
    );

    expect(screen.queryByRole('button', { name: /新建项目/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '导入 Excel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '下载模板' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查看/ })).toBeInTheDocument();
  });

  it('详情模式下返回、编辑、删除会调用对应回调', () => {
    const onCloseDetail = vi.fn();
    const onOpenProjectModal = vi.fn();
    const onDeleteProject = vi.fn();

    render(
      <ProjectManagementPage
        {...buildProps({
          selectedProjectId: project.id,
          selectedProjectDetail: project,
          onCloseDetail,
          onOpenProjectModal,
          onDeleteProject,
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(onCloseDetail).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '编辑项目' }));
    expect(onOpenProjectModal).toHaveBeenCalledWith(project);
    expect(onCloseDetail).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: '删除项目' }));
    expect(onDeleteProject).toHaveBeenCalledWith(1);
    expect(onCloseDetail).toHaveBeenCalledTimes(3);
  });
});
