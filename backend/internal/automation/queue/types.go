// Package queue provides a job queue and worker pool for async automation execution.
// This ensures reliable, rate-limited execution of automation actions with retry support.
//
// Architecture:
//
//	┌─────────────────────────────────────────────────────────────────┐
//	│                       JOB QUEUE SYSTEM                          │
//	├─────────────────────────────────────────────────────────────────┤
//	│                                                                 │
//	│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
//	│  │  Producer   │───▶│  Job Queue  │───▶│    Worker Pool     │ │
//	│  │ (Services)  │    │  (Channel)  │    │  (N Goroutines)    │ │
//	│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
//	│                            │                     │             │
//	│                            ▼                     ▼             │
//	│  ┌─────────────────────────────────────────────────────────┐  │
//	│  │              Retry Queue (Failed Jobs)                   │  │
//	│  │   with exponential backoff and max retry limits          │  │
//	│  └─────────────────────────────────────────────────────────┘  │
//	│                                                                │
//	└─────────────────────────────────────────────────────────────────┘
package queue

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// JobStatus represents the current state of a job.
type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusCompleted JobStatus = "completed"
	JobStatusFailed    JobStatus = "failed"
	JobStatusRetrying  JobStatus = "retrying"
	JobStatusCancelled JobStatus = "cancelled"
)

// JobPriority defines job execution priority.
type JobPriority int

const (
	PriorityLow    JobPriority = 1
	PriorityNormal JobPriority = 5
	PriorityHigh   JobPriority = 10
)

// Job represents a unit of work to be executed asynchronously.
type Job struct {
	// ID is the unique identifier for this job.
	ID string `json:"id"`

	// Type identifies the kind of job (e.g., "automation_rule", "webhook").
	Type string `json:"type"`

	// Payload contains the job-specific data.
	Payload map[string]interface{} `json:"payload"`

	// Priority determines execution order.
	Priority JobPriority `json:"priority"`

	// Status is the current job status.
	Status JobStatus `json:"status"`

	// Attempts is the number of execution attempts.
	Attempts int `json:"attempts"`

	// MaxAttempts is the maximum number of retry attempts.
	MaxAttempts int `json:"max_attempts"`

	// CreatedAt is when the job was created.
	CreatedAt time.Time `json:"created_at"`

	// StartedAt is when execution began.
	StartedAt *time.Time `json:"started_at,omitempty"`

	// CompletedAt is when execution finished.
	CompletedAt *time.Time `json:"completed_at,omitempty"`

	// Error contains the last error message if failed.
	Error string `json:"error,omitempty"`

	// Result contains the execution result if successful.
	Result interface{} `json:"result,omitempty"`

	// Metadata contains additional job info.
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// BoardID is the associated board for scoping.
	BoardID uuid.UUID `json:"board_id"`

	// RuleID is the automation rule ID if applicable.
	RuleID *uuid.UUID `json:"rule_id,omitempty"`
}

// NewJob creates a new job with default values.
func NewJob(jobType string, payload map[string]interface{}) *Job {
	return &Job{
		ID:          uuid.New().String(),
		Type:        jobType,
		Payload:     payload,
		Priority:    PriorityNormal,
		Status:      JobStatusPending,
		Attempts:    0,
		MaxAttempts: 3,
		CreatedAt:   time.Now(),
		Metadata:    make(map[string]interface{}),
	}
}

// JobHandler is a function that processes a job.
type JobHandler func(ctx context.Context, job *Job) error

// JobResult is returned by handlers to provide execution details.
type JobResult struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   error       `json:"error,omitempty"`
}
