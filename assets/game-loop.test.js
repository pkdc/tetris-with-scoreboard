import {createGameLoop} from './game-loop.js';

// Simulate N frames at ~16ms intervals starting from a given time
function tickFrames(loop, startTime, count) {
    let result = false;
    for (let i = 1; i <= count; i++) {
        result = loop.tick(startTime + i * 16);
    }
    return result;
}

describe('createGameLoop', () => {
    let loop;

    beforeEach(() => {
        loop = createGameLoop();
    });

    test('does not trigger drop before 1000ms', () => {
        loop.tick(0); // first frame, dt=0
        // ~62 frames = 992ms, not enough
        expect(tickFrames(loop, 0, 62)).toBe(false);
    });

    test('triggers drop after 1000ms of frames', () => {
        loop.tick(0);
        // ~63 frames = 1008ms, should trigger
        expect(tickFrames(loop, 0, 63)).toBe(true);
    });

    test('resets accumulator after a drop', () => {
        loop.tick(0);
        // Accumulate to first drop
        const dropTime = 63 * 16; // 1008ms
        tickFrames(loop, 0, 63); // triggers drop

        // After drop, accumulator resets — need another 1000ms
        expect(tickFrames(loop, dropTime, 62)).toBe(false); // 992ms
        expect(loop.tick(dropTime + 63 * 16)).toBe(true);   // 1008ms
    });

    test('fast drop triggers on the very next tick', () => {
        loop.tick(0);
        loop.tick(100); // 100ms accumulated (capped, but only 1 frame so 100ms)
        loop.requestFastDrop();
        expect(loop.tick(116)).toBe(true);
    });

    test('fast drop flag is cleared after use', () => {
        loop.tick(0);
        loop.requestFastDrop();
        loop.tick(16); // consumes the fast drop
        expect(loop.tick(32)).toBe(false); // back to normal timing
    });

    test('dt spike is capped at maxDt', () => {
        loop.tick(0);
        // 5-second gap — only maxDt (100ms) should accumulate
        loop.tick(5000);
        // Total accum is now 100ms. Need 900ms more → 57 frames (57*16=912)
        expect(tickFrames(loop, 5000, 56)).toBe(false); // 896ms + 100ms = 996ms
        expect(loop.tick(5000 + 57 * 16)).toBe(true);   // 912ms + 100ms = 1012ms
    });

    test('custom maxDt is respected', () => {
        loop = createGameLoop({ maxDt: 200 });
        loop.tick(0);
        // 5-second gap — capped to 200ms
        loop.tick(5000);
        // accum = 200ms. Need 800ms more → 50 frames
        expect(tickFrames(loop, 5000, 49)).toBe(false);
        expect(loop.tick(5000 + 50 * 16)).toBe(true);
    });

    test('custom dropInterval is respected', () => {
        loop = createGameLoop({ dropInterval: 500 });
        loop.tick(0);
        // 500ms / 16ms = 31.25 → need 32 frames (32*16=512)
        expect(tickFrames(loop, 0, 31)).toBe(false); // 496ms
        expect(loop.tick(32 * 16)).toBe(true);        // 512ms >= 500
    });

    test('reset clears all state', () => {
        loop.tick(0);
        tickFrames(loop, 0, 50); // accumulate ~800ms
        loop.requestFastDrop();
        loop.reset();
        // After reset: first tick gives dt=0, no fast drop pending
        expect(loop.tick(2000)).toBe(false);
        // Then need 1000ms of normal frames
        expect(tickFrames(loop, 2000, 62)).toBe(false);
        expect(loop.tick(2000 + 63 * 16)).toBe(true);
    });

    test('first frame always yields dt=0', () => {
        expect(loop.tick(99999)).toBe(false);
    });

    test('reset after pause: no dt spike when resuming after a large timestamp gap', () => {
        // Simulate active loop for ~500ms
        loop.tick(0);
        tickFrames(loop, 0, 31); // 496ms accumulated, no drop yet
        // Pause happens → caller cancels rAF and calls reset()
        loop.reset();
        // Resume 10 seconds later — without reset this would be a huge dt spike
        // that immediately triggers a drop. With reset, first tick is dt=0
        // and we need a full 1000ms of subsequent frames.
        expect(loop.tick(10000)).toBe(false); // first frame after reset: dt=0
        expect(tickFrames(loop, 10000, 62)).toBe(false); // 992ms
        expect(loop.tick(10000 + 63 * 16)).toBe(true);   // 1008ms
    });

    test('requestFastDrop set before reset is cleared by reset', () => {
        loop.tick(0);
        loop.requestFastDrop();
        loop.reset();
        // The fast drop request should be gone — next tick should behave normally
        expect(loop.tick(16)).toBe(false);
        expect(loop.tick(32)).toBe(false);
    });
});
