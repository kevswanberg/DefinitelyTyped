import { Scenario } from 'k6/scenario';

const sharedIterations = {
    executor: 'shared-iterations',
    vus: 10,
    iterations: 200,
    maxDuration: '10s'
};

const perVuScenario = {
    executor: 'per-vu-iterations',
    vus: 10,
    iterations: 20,
    maxDuration: '1m'
};

const constatnVuScenario = {
    executor: 'constant-vus',
    vus: 10,
    duration: '45m',
};

const rampingScenario = {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
        { duration: '5s', target: 100 },
        { duration: '5s', target: 0 },
    ],
    gracefulRampDown: '0s',
};

const constantArrivalRateScenario = {
    executor: 'constant-arrival-rate',
    rate: 200,  // 200 RPS, since timeUnit is the default 1s
    duration: '1m',
    preAllocatedVUs: 50,
    maxVUs: 100,
};

const rampingArrivalExecutor = {
    executor: 'ramping-arrival-rate',
    startRate: 50,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 100,
    stages: [
        { target: 200, duration: '30s' },
        { target: 0, duration: '30s' },
    ],
};

const externallControlledScenario = {
    executor: 'externally-controlled',
    vus: 0,
    maxVUs: 50,
    duration: '10m',
};
