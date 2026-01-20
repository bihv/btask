package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/mello/backend/internal/middleware"
	"github.com/mello/backend/internal/repository"
)

type SearchHandler struct {
	workspaceRepo *repository.WorkspaceRepository
	boardRepo     *repository.BoardRepository
	cardRepo      *repository.CardRepository
}

func NewSearchHandler() *SearchHandler {
	return &SearchHandler{
		workspaceRepo: repository.NewWorkspaceRepository(),
		boardRepo:     repository.NewBoardRepository(),
		cardRepo:      repository.NewCardRepository(),
	}
}

type SearchResult struct {
	Workspaces []WorkspaceSearchItem `json:"workspaces"`
	Boards     []BoardSearchItem     `json:"boards"`
	Cards      []CardSearchItem      `json:"cards"`
}

type WorkspaceSearchItem struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type BoardSearchItem struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	WorkspaceName string `json:"workspace_name,omitempty"`
}

type CardSearchItem struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	BoardID    string `json:"board_id"`
	BoardTitle string `json:"board_title,omitempty"`
}

func (h *SearchHandler) Search(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	query := strings.TrimSpace(c.Query("q"))

	if len(query) < 2 {
		return c.JSON(fiber.Map{
			"success": true,
			"data": SearchResult{
				Workspaces: []WorkspaceSearchItem{},
				Boards:     []BoardSearchItem{},
				Cards:      []CardSearchItem{},
			},
		})
	}

	result := SearchResult{
		Workspaces: []WorkspaceSearchItem{},
		Boards:     []BoardSearchItem{},
		Cards:      []CardSearchItem{},
	}

	// Search workspaces
	workspaces, err := h.workspaceRepo.SearchByName(userID, query, 10)
	if err == nil {
		for _, ws := range workspaces {
			result.Workspaces = append(result.Workspaces, WorkspaceSearchItem{
				ID:   ws.ID.String(),
				Name: ws.Name,
			})
		}
	}

	// Search boards
	boards, err := h.boardRepo.SearchByTitle(userID, query, 10)
	if err == nil {
		for _, board := range boards {
			item := BoardSearchItem{
				ID:            board.ID.String(),
				Title:         board.Title,
				WorkspaceName: board.Workspace.Name,
			}
			result.Boards = append(result.Boards, item)
		}
	}

	// Search cards (title, description, labels)
	cards, err := h.cardRepo.Search(userID, query, 15)
	if err == nil {
		for _, card := range cards {
			boardTitle := ""
			// Fix: Check ID instead of nil since Board is a struct value
			if card.List.Board.ID != uuid.Nil {
				boardTitle = card.List.Board.Title
			}
			item := CardSearchItem{
				ID:         card.ID.String(),
				Title:      card.Title,
				BoardID:    card.List.BoardID.String(),
				BoardTitle: boardTitle,
			}
			result.Cards = append(result.Cards, item)
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}
