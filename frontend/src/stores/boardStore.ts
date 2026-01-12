import { create } from 'zustand';
import { Board, List, Card } from '@/types';
import api from '@/lib/api';

interface BoardState {
    currentBoard: Board | null;
    lists: List[];
    isLoading: boolean;
    error: string | null;
    showCardCovers: boolean;

    fetchBoard: (boardId: string) => Promise<void>;
    createList: (boardId: string, title: string) => Promise<void>;
    updateList: (listId: string, title: string) => Promise<void>;
    updateListColor: (listId: string, color: string | null) => Promise<void>;
    deleteList: (listId: string) => Promise<void>;
    moveList: (listId: string, position: number) => Promise<void>;
    copyList: (listId: string, title?: string) => Promise<void>;
    moveAllCards: (sourceListId: string, targetListId: string) => Promise<void>;
    sortCards: (listId: string, sortBy: 'date_newest' | 'date_oldest' | 'alphabetical') => Promise<void>;

    createCard: (listId: string, title: string) => Promise<void>;
    updateCard: (cardId: string, data: Partial<Card>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    moveCard: (cardId: string, listId: string, position: number) => Promise<void>;

    setLists: (lists: List[]) => void;
    optimisticMoveCard: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => void;
    toggleShowCardCovers: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    currentBoard: null,
    lists: [],
    isLoading: false,
    error: null,
    showCardCovers: true,

    fetchBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/boards/${boardId}`);
            const board = response.data.data;
            set({ currentBoard: board, lists: board.lists || [], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    createList: async (boardId: string, title: string) => {
        try {
            const response = await api.post(`/boards/${boardId}/lists`, { title });
            const newList = { ...response.data.data, cards: [] };
            set((state) => ({ lists: [...state.lists, newList] }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateList: async (listId: string, title: string) => {
        try {
            await api.put(`/lists/${listId}`, { title });
            set((state) => ({
                lists: state.lists.map((list) =>
                    list.id === listId ? { ...list, title } : list
                ),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateListColor: async (listId: string, color: string | null) => {
        // Optimistic update
        set((state) => ({
            lists: state.lists.map((list) =>
                list.id === listId ? { ...list, color: color || undefined } : list
            ),
        }));
        try {
            await api.put(`/lists/${listId}`, { color: color || '' });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteList: async (listId: string) => {
        try {
            await api.delete(`/lists/${listId}`);
            set((state) => ({
                lists: state.lists.filter((list) => list.id !== listId),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    moveList: async (listId: string, position: number) => {
        // Optimistic update
        set((state) => {
            const oldIndex = state.lists.findIndex((l) => l.id === listId);
            if (oldIndex === -1 || oldIndex === position) return state;

            const newLists = [...state.lists];
            const [removed] = newLists.splice(oldIndex, 1);
            newLists.splice(position, 0, removed);

            // Update positions
            newLists.forEach((list, i) => {
                list.position = i;
            });

            return { lists: newLists };
        });

        try {
            await api.put(`/lists/${listId}/move`, { position });
        } catch (error: any) {
            set({ error: error.message });
            // Refetch board on error to restore state
            const boardId = get().currentBoard?.id;
            if (boardId) {
                get().fetchBoard(boardId);
            }
        }
    },

    copyList: async (listId: string, title?: string) => {
        try {
            const response = await api.post(`/lists/${listId}/copy`, { title });
            const newList = response.data.data;
            set((state) => ({ lists: [...state.lists, newList] }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    moveAllCards: async (sourceListId: string, targetListId: string) => {
        // Optimistic update - move cards in local state
        set((state) => {
            const newLists = state.lists.map(list => ({ ...list, cards: [...(list.cards || [])] }));
            const sourceList = newLists.find(l => l.id === sourceListId);
            const targetList = newLists.find(l => l.id === targetListId);

            if (sourceList && targetList && sourceList.cards) {
                const cards = sourceList.cards;
                sourceList.cards = [];
                targetList.cards = [...(targetList.cards || []), ...cards];
            }
            return { lists: newLists };
        });

        try {
            await api.post(`/lists/${sourceListId}/move-all-cards`, { target_list_id: targetListId });
        } catch (error: any) {
            set({ error: error.message });
            // Refetch board on error
            const boardId = get().currentBoard?.id;
            if (boardId) {
                get().fetchBoard(boardId);
            }
        }
    },

    sortCards: async (listId: string, sortBy: 'date_newest' | 'date_oldest' | 'alphabetical') => {
        try {
            await api.post(`/lists/${listId}/sort-cards`, { sort_by: sortBy });
            // Refetch board to get updated card order
            const boardId = get().currentBoard?.id;
            if (boardId) {
                get().fetchBoard(boardId);
            }
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    createCard: async (listId: string, title: string) => {
        try {
            const response = await api.post(`/lists/${listId}/cards`, { title });
            const newCard = response.data.data;
            set((state) => ({
                lists: state.lists.map((list) =>
                    list.id === listId
                        ? { ...list, cards: [...(list.cards || []), newCard] }
                        : list
                ),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    updateCard: async (cardId: string, data: Partial<Card>) => {
        try {
            await api.put(`/cards/${cardId}`, data);
            set((state) => ({
                lists: state.lists.map((list) => ({
                    ...list,
                    cards: list.cards?.map((card) =>
                        card.id === cardId ? { ...card, ...data } : card
                    ),
                })),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    deleteCard: async (cardId: string) => {
        try {
            await api.delete(`/cards/${cardId}`);
            set((state) => ({
                lists: state.lists.map((list) => ({
                    ...list,
                    cards: list.cards?.filter((card) => card.id !== cardId),
                })),
            }));
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    moveCard: async (cardId: string, listId: string, position: number) => {
        try {
            await api.put(`/cards/${cardId}/move`, { list_id: listId, position });
        } catch (error: any) {
            set({ error: error.message });
            // Refetch board on error to restore state
            const boardId = get().currentBoard?.id;
            if (boardId) {
                get().fetchBoard(boardId);
            }
        }
    },

    setLists: (lists: List[]) => {
        set({ lists });
    },

    optimisticMoveCard: (cardId: string, sourceListId: string, destListId: string, destIndex: number) => {
        set((state) => {
            const newLists = state.lists.map(l => ({ ...l, cards: [...(l.cards || [])] }));

            const sourceList = newLists.find((l) => l.id === sourceListId);
            const destList = newLists.find((l) => l.id === destListId);

            if (!sourceList || !destList) return state;

            const cardIndex = sourceList.cards?.findIndex((c) => c.id === cardId) ?? -1;
            if (cardIndex === -1) return state;

            // Same list reordering
            if (sourceListId === destListId) {
                // Don't do anything if position hasn't changed
                if (cardIndex === destIndex) return state;

                const cards = [...sourceList.cards!];
                const [removed] = cards.splice(cardIndex, 1);
                cards.splice(destIndex, 0, removed);

                // Update positions
                cards.forEach((c, i) => (c.position = i));

                return {
                    lists: newLists.map((l) =>
                        l.id === sourceListId ? { ...l, cards } : l
                    ),
                };
            }

            // Different list - move card between lists
            const [card] = sourceList.cards!.splice(cardIndex, 1);
            card.list_id = destListId;

            if (!destList.cards) destList.cards = [];
            destList.cards.splice(destIndex, 0, card);

            // Update positions
            sourceList.cards?.forEach((c, i) => (c.position = i));
            destList.cards?.forEach((c, i) => (c.position = i));

            return { lists: newLists };
        });
    },

    toggleShowCardCovers: () => {
        set((state) => ({ showCardCovers: !state.showCardCovers }));
    },
}));
