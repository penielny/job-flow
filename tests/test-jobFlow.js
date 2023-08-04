// tests/test-jobQueue.js

const { JobQueue } = require('../lib/jobFlow');

describe('JobQueue', () => {
  let jobQueue;

  beforeEach(() => {
    jobQueue = new JobQueue();
    // Avoid saving to disk during tests
    jobQueue.saveToDisk = jest.fn().mockResolvedValue();
  });

  it('should add a job to the queue', async () => {
    const data = { name: 'John', age: 30 };
    const jobId = await jobQueue.addJob(data);
    expect(jobQueue.jobs.length).toBe(1);
    expect(jobId).toBe(1);
  });

  it('should process a job successfully', async () => {
    const data = { name: 'Alice', age: 25 };
    const expectedResult = 'Hello, Alice!';
    jobQueue.setProcessFunction(async (job) => {
      return `Hello, ${job.data.name}!`;
    });
    await jobQueue.addJob(data);
    await jobQueue.processJobs();
    expect(jobQueue.jobs.length).toBe(0);
    expect(jobQueue.jobs[0].status).toBe('completed');
    expect(jobQueue.jobs[0].result).toBe(expectedResult);
  });

  it('should handle a failed job with retry', async () => {
    const data = { name: 'Bob', age: 28 };
    const errorMessage = 'Oops, something went wrong!';
    let retryCount = 0;
    jobQueue.setProcessFunction(async () => {
      retryCount++;
      throw new Error(errorMessage);
    });
    await jobQueue.addJob(data);
    await jobQueue.processJobs();
    expect(jobQueue.jobs.length).toBe(1);
    expect(jobQueue.jobs[0].status).toBe('failed');
    expect(jobQueue.jobs[0].error.message).toBe(errorMessage);
    expect(retryCount).toBe(1); // Check if the job was retried once
  });
});
