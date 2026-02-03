package queue

import (
	"context"
	"log"
	"sync"
	"time"
)

// QueueConfig holds configuration for the job queue.
type QueueConfig struct {
	// WorkerCount is the number of concurrent workers.
	WorkerCount int

	// QueueSize is the max number of jobs in the queue.
	QueueSize int

	// RetryBaseDelay is the initial delay for retry backoff.
	RetryBaseDelay time.Duration

	// RetryMaxDelay is the maximum delay between retries.
	RetryMaxDelay time.Duration

	// JobTimeout is the max execution time per job.
	JobTimeout time.Duration

	// RateLimit is the max jobs per second (0 = unlimited).
	RateLimit int
}

// DefaultConfig returns a sensible default configuration.
func DefaultConfig() QueueConfig {
	return QueueConfig{
		WorkerCount:    5,
		QueueSize:      1000,
		RetryBaseDelay: 1 * time.Second,
		RetryMaxDelay:  5 * time.Minute,
		JobTimeout:     30 * time.Second,
		RateLimit:      100,
	}
}

// JobQueue manages job processing with workers.
type JobQueue struct {
	config   QueueConfig
	handlers map[string]JobHandler
	jobs     chan *Job
	retry    chan *Job
	wg       sync.WaitGroup
	mu       sync.RWMutex
	ctx      context.Context
	cancel   context.CancelFunc
	running  bool

	// Rate limiting
	rateLimiter chan struct{}

	// Stats
	stats QueueStats
}

// QueueStats tracks queue performance metrics.
type QueueStats struct {
	mu             sync.RWMutex
	TotalProcessed int64         `json:"total_processed"`
	TotalFailed    int64         `json:"total_failed"`
	TotalRetried   int64         `json:"total_retried"`
	AvgDuration    time.Duration `json:"avg_duration"`
	QueueLength    int           `json:"queue_length"`
}

// NewJobQueue creates a new job queue with the given configuration.
func NewJobQueue(config QueueConfig) *JobQueue {
	ctx, cancel := context.WithCancel(context.Background())

	q := &JobQueue{
		config:   config,
		handlers: make(map[string]JobHandler),
		jobs:     make(chan *Job, config.QueueSize),
		retry:    make(chan *Job, config.QueueSize/10), // Smaller retry queue
		ctx:      ctx,
		cancel:   cancel,
		running:  false,
	}

	// Setup rate limiter if configured
	if config.RateLimit > 0 {
		q.rateLimiter = make(chan struct{}, config.RateLimit)
		go q.refillRateLimiter()
	}

	return q
}

// refillRateLimiter refills the rate limiter bucket every second.
func (q *JobQueue) refillRateLimiter() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-q.ctx.Done():
			return
		case <-ticker.C:
			// Refill tokens
			for i := 0; i < q.config.RateLimit; i++ {
				select {
				case q.rateLimiter <- struct{}{}:
				default:
					// Bucket full
				}
			}
		}
	}
}

// RegisterHandler registers a handler for a job type.
func (q *JobQueue) RegisterHandler(jobType string, handler JobHandler) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.handlers[jobType] = handler
}

// Enqueue adds a job to the queue.
func (q *JobQueue) Enqueue(job *Job) error {
	select {
	case q.jobs <- job:
		q.updateQueueLength()
		log.Printf("[Queue] Job enqueued: %s (type: %s)", job.ID, job.Type)
		return nil
	default:
		return ErrQueueFull
	}
}

// EnqueueWithPriority adds a job with specific priority.
func (q *JobQueue) EnqueueWithPriority(job *Job, priority JobPriority) error {
	job.Priority = priority
	return q.Enqueue(job)
}

// Start begins processing jobs with the worker pool.
func (q *JobQueue) Start() {
	q.mu.Lock()
	if q.running {
		q.mu.Unlock()
		return
	}
	q.running = true
	q.mu.Unlock()

	log.Printf("[Queue] Starting %d workers", q.config.WorkerCount)

	// Start workers
	for i := 0; i < q.config.WorkerCount; i++ {
		q.wg.Add(1)
		go q.worker(i)
	}

	// Start retry processor
	q.wg.Add(1)
	go q.retryProcessor()
}

// Stop gracefully shuts down the queue.
func (q *JobQueue) Stop() {
	q.mu.Lock()
	if !q.running {
		q.mu.Unlock()
		return
	}
	q.running = false
	q.mu.Unlock()

	log.Println("[Queue] Stopping queue...")
	q.cancel()
	q.wg.Wait()
	log.Println("[Queue] Queue stopped")
}

// worker processes jobs from the queue.
func (q *JobQueue) worker(id int) {
	defer q.wg.Done()
	log.Printf("[Queue] Worker %d started", id)

	for {
		select {
		case <-q.ctx.Done():
			log.Printf("[Queue] Worker %d stopping", id)
			return

		case job := <-q.jobs:
			q.processJob(id, job)
		}
	}
}

// processJob handles a single job execution.
func (q *JobQueue) processJob(workerID int, job *Job) {
	// Apply rate limiting
	if q.rateLimiter != nil {
		<-q.rateLimiter
	}

	// Get handler
	q.mu.RLock()
	handler, exists := q.handlers[job.Type]
	q.mu.RUnlock()

	if !exists {
		log.Printf("[Queue] Worker %d: No handler for job type: %s", workerID, job.Type)
		job.Status = JobStatusFailed
		job.Error = "no handler registered for job type: " + job.Type
		return
	}

	// Execute with timeout
	startTime := time.Now()
	job.Status = JobStatusRunning
	job.StartedAt = &startTime
	job.Attempts++

	ctx, cancel := context.WithTimeout(q.ctx, q.config.JobTimeout)
	defer cancel()

	// Execute handler
	err := handler(ctx, job)
	duration := time.Since(startTime)

	if err != nil {
		log.Printf("[Queue] Worker %d: Job %s failed (attempt %d/%d): %v",
			workerID, job.ID, job.Attempts, job.MaxAttempts, err)

		job.Error = err.Error()

		// Check if we should retry
		if job.Attempts < job.MaxAttempts {
			job.Status = JobStatusRetrying
			q.scheduleRetry(job)
			q.stats.incrementRetried()
		} else {
			job.Status = JobStatusFailed
			now := time.Now()
			job.CompletedAt = &now
			q.stats.incrementFailed()
		}
	} else {
		log.Printf("[Queue] Worker %d: Job %s completed in %v", workerID, job.ID, duration)
		job.Status = JobStatusCompleted
		now := time.Now()
		job.CompletedAt = &now
		q.stats.incrementProcessed(duration)
	}

	q.updateQueueLength()
}

// scheduleRetry adds a job to the retry queue with exponential backoff.
func (q *JobQueue) scheduleRetry(job *Job) {
	// Calculate backoff delay: base * 2^(attempts-1)
	delay := q.config.RetryBaseDelay * time.Duration(1<<(job.Attempts-1))
	if delay > q.config.RetryMaxDelay {
		delay = q.config.RetryMaxDelay
	}

	job.Metadata["retry_at"] = time.Now().Add(delay)
	job.Metadata["retry_delay"] = delay.String()

	log.Printf("[Queue] Job %s scheduled for retry in %v", job.ID, delay)

	select {
	case q.retry <- job:
	default:
		log.Printf("[Queue] Retry queue full, dropping job: %s", job.ID)
		job.Status = JobStatusFailed
	}
}

// retryProcessor handles retrying failed jobs.
func (q *JobQueue) retryProcessor() {
	defer q.wg.Done()

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	var pending []*Job

	for {
		select {
		case <-q.ctx.Done():
			return

		case job := <-q.retry:
			pending = append(pending, job)

		case <-ticker.C:
			// Check pending jobs for retry
			now := time.Now()
			var stillPending []*Job

			for _, job := range pending {
				retryAt, ok := job.Metadata["retry_at"].(time.Time)
				if !ok || now.After(retryAt) {
					// Ready to retry
					job.Status = JobStatusPending
					select {
					case q.jobs <- job:
						log.Printf("[Queue] Job %s retrying (attempt %d)", job.ID, job.Attempts+1)
					default:
						// Queue full, keep in pending
						stillPending = append(stillPending, job)
					}
				} else {
					stillPending = append(stillPending, job)
				}
			}

			pending = stillPending
		}
	}
}

// updateQueueLength updates the current queue length stat.
func (q *JobQueue) updateQueueLength() {
	q.stats.mu.Lock()
	q.stats.QueueLength = len(q.jobs)
	q.stats.mu.Unlock()
}

// Stats returns the current queue statistics.
func (q *JobQueue) Stats() QueueStats {
	q.stats.mu.RLock()
	defer q.stats.mu.RUnlock()
	return QueueStats{
		TotalProcessed: q.stats.TotalProcessed,
		TotalFailed:    q.stats.TotalFailed,
		TotalRetried:   q.stats.TotalRetried,
		AvgDuration:    q.stats.AvgDuration,
		QueueLength:    len(q.jobs),
	}
}

func (s *QueueStats) incrementProcessed(duration time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.TotalProcessed++
	// Update rolling average
	s.AvgDuration = (s.AvgDuration*time.Duration(s.TotalProcessed-1) + duration) / time.Duration(s.TotalProcessed)
}

func (s *QueueStats) incrementFailed() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.TotalFailed++
}

func (s *QueueStats) incrementRetried() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.TotalRetried++
}
