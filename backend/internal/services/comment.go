package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/mello/backend/internal/models"
	"github.com/mello/backend/internal/repository"
)

type CommentService struct {
	commentRepo   *repository.CommentRepository
	cardRepo      *repository.CardRepository
	listRepo      *repository.ListRepository
	boardRepo     *repository.BoardRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewCommentService() *CommentService {
	return &CommentService{
		commentRepo:   repository.NewCommentRepository(),
		cardRepo:      repository.NewCardRepository(),
		listRepo:      repository.NewListRepository(),
		boardRepo:     repository.NewBoardRepository(),
		workspaceRepo: repository.NewWorkspaceRepository(),
	}
}

func (s *CommentService) Create(cardID uuid.UUID, userID uuid.UUID, req models.CreateCommentRequest) (*models.Comment, error) {
	if !s.hasCardAccess(cardID, userID) {
		return nil, errors.New("access denied")
	}

	comment := &models.Comment{
		CardID:  cardID,
		UserID:  userID,
		Content: req.Content,
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	return s.commentRepo.FindByID(comment.ID)
}

func (s *CommentService) GetByCardID(cardID uuid.UUID, userID uuid.UUID) ([]models.Comment, error) {
	if !s.hasCardAccess(cardID, userID) {
		return nil, errors.New("access denied")
	}

	return s.commentRepo.FindByCardID(cardID)
}

func (s *CommentService) Update(commentID uuid.UUID, userID uuid.UUID, req models.UpdateCommentRequest) (*models.Comment, error) {
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return nil, errors.New("comment not found")
	}

	if comment.UserID != userID {
		return nil, errors.New("only comment author can update")
	}

	comment.Content = req.Content

	if err := s.commentRepo.Update(comment); err != nil {
		return nil, err
	}

	return comment, nil
}

func (s *CommentService) Delete(commentID uuid.UUID, userID uuid.UUID) error {
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return errors.New("comment not found")
	}

	if comment.UserID != userID {
		return errors.New("only comment author can delete")
	}

	return s.commentRepo.Delete(commentID)
}

func (s *CommentService) hasCardAccess(cardID uuid.UUID, userID uuid.UUID) bool {
	card, err := s.cardRepo.FindByID(cardID)
	if err != nil {
		return false
	}

	list, err := s.listRepo.FindByID(card.ListID)
	if err != nil {
		return false
	}

	board, err := s.boardRepo.FindByID(list.BoardID)
	if err != nil {
		return false
	}

	return s.workspaceRepo.IsOwner(board.WorkspaceID, userID) || s.workspaceRepo.IsMember(board.WorkspaceID, userID)
}
