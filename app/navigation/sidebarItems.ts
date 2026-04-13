import type { AppTabDefinition, SidebarGroupId } from './tabRegistry';
import { APP_TABS, SIDEBAR_GROUP_LABELS, getTabTitle } from './tabRegistry';

export type SidebarItem = AppTabDefinition;

export type SidebarSection = {
  id: SidebarGroupId;
  label: string;
  items: SidebarItem[];
};

export const SIDEBAR_ITEMS: SidebarItem[] = APP_TABS;

export { SIDEBAR_GROUP_LABELS, getTabTitle };

export function getVisibleSidebarItems(params: {
  currentUserId: string;
  hasPermission: (permission: string) => boolean;
}): SidebarItem[] {
  const { currentUserId, hasPermission } = params;

  return SIDEBAR_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return currentUserId === 'admin';
    }
    if (!item.viewPermission) {
      return true;
    }
    return hasPermission(item.viewPermission);
  });
}

export function getVisibleSidebarSections(params: {
  currentUserId: string;
  hasPermission: (permission: string) => boolean;
}): SidebarSection[] {
  const visibleItems = getVisibleSidebarItems(params);
  const sectionOrder: SidebarGroupId[] = ['operations', 'projects', 'resources', 'collaboration', 'system'];

  return sectionOrder
    .map((groupId) => ({
      id: groupId,
      label: SIDEBAR_GROUP_LABELS[groupId],
      items: visibleItems.filter((item) => item.group === groupId),
    }))
    .filter((section) => section.items.length > 0);
}
