// jobQueue.js
const fs = require('fs');
const net = require('net');
const { EventEmitter } = require('events');

class Job {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.status = 'pending';
    this.result = null;
    this.error = null;
    this.createdAt = new Date();
    this.completedAt = null;
  }

  complete(result) {
    this.status = 'completed';
    this.result = result;
    this.completedAt = new Date();
  }


  fail(error, retryDelay = 0) {
    this.status = 'failed';
    this.error = error;
    this.completedAt = new Date();

    if (retryDelay > 0) {
      // Calculate the retry time by adding the retryDelay (in milliseconds) to the current timestamp
      const retryTime = Date.now() + retryDelay;
      this.retryTime = new Date(retryTime);
    } else {
      this.retryTime = null;
    }
  }
}

class JobQueue extends EventEmitter{
  constructor(filePath) {
    super();
    this.jobs = [];
    this.isProcessing = false;
    this.processFunction = null; // Function to execute for each job
    this.filePath = filePath; //queue local storage
    this.tcpServer = null;
    this.workerIdCounter = 1;
  }


  async saveToDisk() {
    try {
      // Filter out completed and failed jobs from the queue before saving
      const pendingJobs = this.jobs.filter(
        (job) => job.status === 'pending'
      );

      const data = JSON.stringify(pendingJobs);
      await fs.promises.writeFile(this.filePath, data, 'utf8');
    } catch (error) {
      console.error('Error saving job queue to disk:', error);
    }
  }


    async loadFromDisk() {
    try {
        const data = await fs.promises.readFile(this.filePath, 'utf8');
        const jobsArray = JSON.parse(data);

        // Convert plain objects into Job instances
        this.jobs = jobsArray.map(jobData => {
            const job = new Job(jobData.id, jobData.data);
            job.status = jobData.status;
            job.result = jobData.result;
            job.error = jobData.error;
            job.createdAt = new Date(jobData.createdAt);
            job.completedAt = jobData.completedAt ? new Date(jobData.completedAt) : null;
            job.retryTime = jobData.retryTime ? new Date(jobData.retryTime) : null;
            return job;
        });

        console.log("Job queue loaded from disk:", this.jobs);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error loading job queue from disk:', error);
        }
    }
}


  async init(port = 5673) {
    await this.loadFromDisk();

    // Start processing the queue if it's not already processing
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processJobs();
    }

    // Start the TCP server on the specified port
    this.tcpServer = net.createServer((socket) => {
      socket.setEncoding('utf8');
      console.log('Worker connected');
      // When a worker connects, assign a workerId and send it back to the worker
      const workerId = this.workerIdCounter++;
      const response = JSON.stringify({ workerId });
      socket.write(response);

      // Handle incoming job data from the worker
      socket.on('data', (data) => {
        const jobData = JSON.parse(data);
        // Generate a unique jobId (replace this with your own implementation if needed)
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        // Add the jobId to the jobData and process the job as needed
        this.addJob({ ...jobData, jobId , workerId });
        // Emit an event with the jobId and workerId
        this.emit('jobQueued', { jobId, workerId });
      });

      // Handle disconnection of the worker
      socket.on('end', () => {
        console.log('Worker disconnected');
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Worker socket error:', error);
      });
    });

    this.tcpServer.listen(port, () => {
      console.log(`Queue TCP server listening on port ${port}`);
    });
  }


  setProcessFunction(func) {
    this.processFunction = func;
  }

  async addJob(data) {
    const jobId = this.jobs.length + 1;
    const job = new Job(jobId, data);
    this.jobs.push(job);
    // Save the job queue to disk immediately after adding a new job
    await this.saveToDisk();
    // Start processing the queue if it's not already processing
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processJobs();
    }

    return jobId;
  }

  async processJobs() {
    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      try {
        if (this.processFunction) {
          if (job.retryTime && job.retryTime > new Date()) {
            // If the job has a retry time set and it's not time for retry yet,
            // re-add the job to the end of the queue and continue processing other jobs.
            this.jobs.push(job);
          } else {
            const result = await this.processFunction(job);
            job.complete(result);
          }
        } else {
          throw new Error('No process function set.');
        }
      } catch (error) {
        // If a job fails, call the `fail` method with a retry delay (e.g., 5 seconds)
        // to schedule the job for a retry after the specified delay.
        job.fail(error, 5000); // Retry after 5 seconds
        this.jobs.push(job);
      } finally {
        // Save the job queue to disk after each processed or retried job
        await this.saveToDisk();
      }
    }
    this.isProcessing = false;
  }
}


class Worker {
  constructor(host = 'localhost', port = 5673) {
    this.host = host;
    this.port = port;
  }

  async addJobToQueue(jobData) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();

      client.connect(this.port, this.host, () => {
        const serializedJobData = JSON.stringify(jobData);
        client.write(serializedJobData);
      });

      client.on('data', (data) => {
        const { jobId, workerId } = JSON.parse(data);
        client.end();
        resolve({ jobId, workerId }); // Resolve the promise with the jobId and workerId
      });

      client.on('error', (error) => {
        client.end();
        reject(error); // Reject the promise with the error
      });
    });
  }
}


module.exports = { JobQueue, Worker };
