package queue

import (
	"sync"
)

var (
	globalQueue     *JobQueue
	globalQueueOnce sync.Once
)

// Initialize sets up the global job queue with the given configuration.
// Should be called once during application startup.
func Initialize(config QueueConfig) *JobQueue {
	globalQueueOnce.Do(func() {
		globalQueue = NewJobQueue(config)
	})
	return globalQueue
}

// InitializeDefault sets up the global queue with default configuration.
func InitializeDefault() *JobQueue {
	return Initialize(DefaultConfig())
}

// Queue returns the global job queue instance.
// Returns nil if not initialized.
func Queue() *JobQueue {
	return globalQueue
}

// MustQueue returns the global job queue or panics if not initialized.
func MustQueue() *JobQueue {
	if globalQueue == nil {
		panic("job queue not initialized - call Initialize() first")
	}
	return globalQueue
}

// StartQueue starts the global job queue.
func StartQueue() {
	if globalQueue != nil {
		globalQueue.Start()
	}
}

// StopQueue stops the global job queue.
func StopQueue() {
	if globalQueue != nil {
		globalQueue.Stop()
	}
}

// Dispatch is a convenience function to enqueue a job to the global queue.
func Dispatch(job *Job) error {
	if globalQueue == nil {
		return ErrQueueStopped
	}
	return globalQueue.Enqueue(job)
}

// DispatchJob creates and enqueues a job in one call.
func DispatchJob(jobType string, payload map[string]interface{}) error {
	job := NewJob(jobType, payload)
	return Dispatch(job)
}
