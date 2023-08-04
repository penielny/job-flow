// examples/example.js

const { JobQueue, Worker } = require('../lib/jobFlow');

async function processJob(job) {
  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Hello, ${job.data.name}!`;
}

const cachePath=  './jobflow.json'
// Initialize the JobQueue and start the TCP server
const jobQueue = new JobQueue(cachePath);
jobQueue.init();

// Create a Worker instance
const worker = new Worker();

// Add a job to the queue using the Worker
worker.addJobToQueue({ name: 'Eve', age: 22 })
  .then(({ jobId, workerId }) => {
    console.log('Job queued successfully. Job ID:', jobId, 'Worker ID:', workerId);
  })
  .catch((error) => {
    console.error('Error adding job:', error.message);
  });

// Listen for jobQueued event
jobQueue.on('jobQueued', ({ jobId, workerId }) => {
  console.log('Job queued in JobQueue. Job ID:', jobId, 'Worker ID:', workerId);
});
