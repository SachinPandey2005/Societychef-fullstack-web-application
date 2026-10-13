import autocannon from 'autocannon';

const url = 'http://localhost:3000/api/v1/health';

const instance = autocannon({
  url,
  connections: 50, // Concurrent connections
  pipelining: 1, // Number of pipelined requests
  duration: 10 // Run for 10 seconds
}, (err, result) => {
  if (err) {
    console.error('Error during benchmark:', err);
  } else {
    console.log('--- Benchmark Results ---');
    console.log(`Requests/sec:  ${result.requests.average}`);
    console.log(`Latency (avg): ${result.latency.average} ms`);
    console.log(`Latency (p99): ${result.latency.p99} ms`);
    console.log(`Total Requests: ${result.requests.total}`);
    console.log('-------------------------');
  }
});

autocannon.track(instance, { renderProgressBar: false });
