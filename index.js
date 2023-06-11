import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import fs from "node:fs";
import readline from "node:readline";
import ThrottleRequest from "./ThrottleRequest.js";

const readable = fs.createReadStream("./resources/mock-data.csv", {
  encoding: "utf8",
});
const writable = fs.createWriteStream("./resources/result.json");
const readLine = readline.createInterface({
  input: readable,
});

const FLOW_RATE = 1000;

function handleLine() {
  let firstChunk = true;
  let headers = [];
  let formatedObject = {};

  return new Transform({
    transform(chunk, encoding, callback) {
      if (firstChunk) {
        // Get Headers
        headers = chunk
          .toString()
          .split(",")
          .map((key) =>
            key.trim().replace(/\s/g, "_").replace(/\W/g, "").toLowerCase()
          );
        firstChunk = false;
        return callback();
      }

      const splitedLine = chunk.toString().split(",");

      headers.forEach(
        (key, index) => (formatedObject[key] = splitedLine[index])
      );

      this.push(JSON.stringify(formatedObject) + ",\r\n");
      callback();
    },
  });
}

const throttle = new ThrottleRequest({
  objectMode: true,
  flowRatePerSecond: FLOW_RATE,
});

console.time("Pipeline");

// With throttling
// await pipeline(readLine, handleLine(), throttle, writable);

// Without Throttling
await pipeline(readLine, handleLine(), writable);

console.timeEnd("Pipeline");
