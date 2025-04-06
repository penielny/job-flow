# JobFlow - Seamless Job Queue Management System

[![NPM Version](https://img.shields.io/npm/v/job-flow.svg)](https://www.npmjs.com/package/job-flow)
[![License](https://img.shields.io/npm/l/job-flow.svg)](https://www.npmjs.com/package/job-flow)

JobFlow is a powerful and efficient Job Queue Management System that simplifies the handling of job queues, task processing, and workload distribution. Whether you're processing background jobs, batch tasks, or managing distributed systems, JobFlow has got you covered!

## Features

- **Effortless Job Processing:** Focus on writing job processing logic, while JobFlow handles queuing, execution, and management seamlessly.

- **Reliable and Fault-Tolerant:** JobFlow ensures fault tolerance by handling job retries, failed jobs, and customizable retry delays for smooth job recovery.

- **Persistent Job Storage:** Say goodbye to job losses during system failures. JobFlow saves your job queue to disk, ensuring queued tasks persist and resume processing after restarts.

- **Scalability and Distributed Processing:** Scale your job processing with ease using JobFlow's distributed architecture, allowing parallel job execution across multiple workers.

- **Worker Connectivity:** Connect workers securely to JobFlow via a TCP server, enabling workers to add jobs to the queue and receive job statuses for seamless communication.

- **User-Friendly API:** JobFlow offers a user-friendly API for quick integration with your existing projects, making it the ideal solution for developers of all levels.

- **Job Monitoring and Event Handling:** Powerful monitoring and event handling capabilities in JobFlow allow you to track job statuses, progress, and customize event-based actions.

## Installation

Install JobFlow via npm:

```bash
yarn add job-flow
```

## Usage

```javascript
const { JobQueue, Worker } = require('job-flow');

// the path to localy cache queue state 
const cachedJobQueue = './videoQueue.json';

const jobQueue = new JobQueue(cachedJobQueue)

// function to be executed for each job in the queue
async function videoTranscode(job) {
    console.log(job.data); //{ filepath: './tasks/data.txt' }
}

// binding the job to the queue
jobQueue.setProcessFunction(videoTranscode)

// starting the queue 
jobQueue.init();

// Create a Worker instance
const worker = new Worker();

// Add a job to the queue using the Worker
worker.addJobToQueue({ filepath: './tasks/data.txt' })
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
```

## Documentation

For detailed information on how to use JobFlow, configuration options, and advanced features, please refer to the [documentation](https://github.com/penielny/job-flow#readme).

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](https://github.com/penielny/job-flow/blob/main/CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/penielny/job-flow/blob/main/LICENSE) file for details.

## Acknowledgments

Special thanks to [list of contributors or libraries you've used].

---

Designed with :heart: by Peniel Nyinkau. Enjoy using JobFlow!
