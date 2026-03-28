"use strict";

export function createGameLoop({ dropInterval = 1000, maxDt = 100 } = {}) {
    let dropAccum = 0;
    let lastTimestamp = -1;
    let fastDropPending = false;

    return {
        reset() {
            dropAccum = 0;
            lastTimestamp = -1;
            fastDropPending = false;
        },
        requestFastDrop() {
            fastDropPending = true;
        },
        tick(timestamp) {
            const dt = lastTimestamp < 0 ? 0 : Math.min(timestamp - lastTimestamp, maxDt);
            lastTimestamp = timestamp;
            dropAccum += dt;
            if (fastDropPending || dropAccum >= dropInterval) {
                fastDropPending = false;
                dropAccum = 0;
                return true;
            }
            return false;
        }
    };
}
