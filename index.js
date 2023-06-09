import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import ThrottleRequest from './ThrottleRequest.js';

const readable = fs.createReadStream('./resources/mock-data.csv', { encoding: 'utf8'})
const writable = fs.createWriteStream('./resources/result.json');

/**
 * It receives the data, processes it by indexing the headers to the current data 
 * and returns a string of a formatted object.
 * @param {Object} data 
 * @returns {String} 
 */
function csvToJson({ line, headers }) {

    let formatedObject = {};

    headers.forEach((key, index) => formatedObject[key.replace(/\W/g, '').toLowerCase()] = line[index]);

    return JSON.stringify(formatedObject) + ',\n';
}

/**
 * Receives a function that will be executed to process the CSV lines
 * @param {Function} callback 
 * @returns {Function}
 */
function transform(callback) {

    return async function* (source) { // Receives and forwards already formatted chunks to the stream
        source.setEncoding('utf8')
        let firstChunk = true;
        let headers = [];

        for await (const chunk of source) {
            for (const line of chunk.split('\r\n')) {
                if (firstChunk) { // getting headers on the first row for indexing the datakia
                    headers = line.split(',');
                    firstChunk = false;
                    continue;
                }
                yield callback({ line: line.split(','), headers })
            }

        }
    }

}

const throttle = new ThrottleRequest({
    objectMode: true, flowRatePerSecond: 10000
});

/**
 * Main function for pipeline initialization
 * @returns {Void}
 */
async function run() {

    try {
        await pipeline(
            readable,
            transform(csvToJson),
            writable
        );
    } catch (error) {
        console.error(error.message);
        return false;
    }

    return true;
}

console.time('Pipeline');

await run();

console.timeEnd('Pipeline');