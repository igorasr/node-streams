import { Transform } from 'node:stream';

/**
 * Transformation flow with rate limiting.
 *
 * @class ThrottleRequest
 */

const ONE_SECOND = 1000;

class ThrottleRequest extends Transform {
    #flowRatePerSecond = 0;
    #internalCounter = 0;

    /**
       * Descrição do construtor da classe.
       *
       * @constructor
       * @param {Object} params - Objeto contendo os parâmetros.
       * @param {number} params.flowRatePerSecond - Flow rate per second.
       * @param {*} params.options - Descrição do parâmetro options (outros parâmetros opcionais).
       */
    constructor({ flowRatePerSecond, ...options }) {
        super(options);
        this.#flowRatePerSecond = flowRatePerSecond;
    }

    _transform(chunk, encoding, callback) {
        this.#internalCounter++;

        if (!(this.#internalCounter >= this.#flowRatePerSecond)) {
            this.push(chunk);
            return callback();
        }

        setTimeout(() => {
            this.#internalCounter = 0;
            this.push(chunk);
            return callback();
        }, ONE_SECOND)
    }

}

export default ThrottleRequest;