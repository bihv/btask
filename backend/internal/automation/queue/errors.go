package queue

import "errors"

var (
	// ErrQueueFull is returned when the queue cannot accept more jobs.
	ErrQueueFull = errors.New("job queue is full")

	// ErrQueueStopped is returned when trying to enqueue to a stopped queue.
	ErrQueueStopped = errors.New("job queue is stopped")

	// ErrHandlerNotFound is returned when no handler is registered for a job type.
	ErrHandlerNotFound = errors.New("no handler registered for job type")

	// ErrJobTimeout is returned when a job exceeds its timeout.
	ErrJobTimeout = errors.New("job execution timed out")

	// ErrMaxRetriesExceeded is returned when a job has exceeded max retry attempts.
	ErrMaxRetriesExceeded = errors.New("job exceeded max retry attempts")
)
