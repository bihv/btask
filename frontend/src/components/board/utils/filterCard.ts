import { FilterState } from '@/components/board/BoardFilterPopover';
import { isDueLater, isDueSoon } from '@/components/common/DueDateTag';
import { Card } from '@/types';
import dayjs from 'dayjs';

/**
 * Shared card filter — used by CalendarView, TableView, etc.
 * Returns true if the card passes all active filters.
 */
export function filterCard(card: Card, filters: FilterState | undefined): boolean {
    if (!filters) return true;

    // Search (title + description)
    if (filters.search) {
        const search = filters.search.toLowerCase();
        const titleMatch = card.title.toLowerCase().includes(search);
        const descMatch = card.description?.toLowerCase().includes(search) || false;
        if (!titleMatch && !descMatch) return false;
    }

    // Labels
    if (filters.labelIds.length > 0 || filters.noLabels) {
        const cardLabelIds = card.labels?.map(l => l.label_id) || [];
        const matchesNoLabels = filters.noLabels && cardLabelIds.length === 0;
        const matchesSpecific = filters.labelIds.length > 0 && filters.labelIds.some(id => cardLabelIds.includes(id));
        if (!matchesNoLabels && !matchesSpecific) return false;
    }

    // Members
    if (filters.memberIds.length > 0 || filters.noMembers) {
        const cardMemberIds = card.members?.map(m => m.user_id) || [];
        const matchesNoMembers = filters.noMembers && cardMemberIds.length === 0;
        const matchesSpecific = filters.memberIds.length > 0 && filters.memberIds.some(id => cardMemberIds.includes(id));
        if (!matchesNoMembers && !matchesSpecific) return false;
    }

    // Due date
    if (filters.dueDate) {
        const now = dayjs();
        const dueDate = card.due_date ? dayjs(card.due_date) : null;
        if (filters.dueDate === 'overdue' && (!dueDate || !dueDate.isBefore(now))) return false;
        if (filters.dueDate === 'due_soon' && (!card.due_date || !isDueSoon(card.due_date))) return false;
        if (filters.dueDate === 'due_later' && (!card.due_date || !isDueLater(card.due_date))) return false;
        if (filters.dueDate === 'no_date' && card.due_date) return false;
    }

    return true;
}
