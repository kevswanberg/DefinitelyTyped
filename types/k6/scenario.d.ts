export type ExecutorName =
    | 'shared-iterations'
    | 'per-vu-iterations'
    | 'constant-vus'
    | 'ramping-vus'
    | 'constant-arrival-rate'
    | 'ramping-arrival-rate'
    | 'externally-controlled';

export interface ScenarioBase {
    /**
     * Unique executor name. See the list of possible values above
     */
    executor: ExecutorName;
    /**
     * Time offset since the start of the test, at which point this scenario should begin execution.
     * @default "0s"
     */
    startTime?: string;
    /**
     * Time to wait for iterations to finish executing before stopping them forcefully. See the gracefulStop section.
     * @default "30s"
     */
    gracefulStop?: string;
    /**
     * Name of exported JS function to execute.
     * @default "default"
     */
    exec?: string;
    /**
     * Environment variables specific to this scenario.
     * @default {}
     */
    env?: Record<string, any>;
    /**
     * Tags specific to this scenario.
     * @default {}
     */
    tags?: Record<string, string>;
}

/**
 * A fixed number of iterations are "shared" between a number of VUs, and the test ends once all iterations are executed.
 * This executor is equivalent to the global vus and iterations options.
 *
 * Note that iterations aren't fairly distributed with this executor, and a VU that executes faster will complete more iterations than others.
 *
 * When to use:
 * This executor is suitable when you want a specific amount of VUs to complete a fixed number of total iterations, and the amount of iterations per VU is not important.
 *
 * @example
 *
 * // Execute 200 total iterations shared by 10 VUs with a maximum duration of 10 seconds:
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     contacts: {
 *       executor: 'shared-iterations',
 *       vus: 10,
 *       iterations: 200,
 *       maxDuration: '10s',
 *     }
 *   }
 * };
 */
export interface SharedIterationsExector extends ScenarioBase {
    executor: 'shared-iterations';
    /**
     * Number of VUs to run concurrently.
     * @default 1
     */
    vus?: number;
    /**
     * Total number of script iterations to execute across all VUs.
     * @default 1
     */
    iterations?: number;
    /**
     * Maximum scenario duration before it's forcibly stopped (excluding gracefulStop).
     * @default "10m"
     */
    maxDuration?: string;
}

/**
 * Each VU executes an exact number of iterations. The total number of completed iterations will be vus * iterations.
 *
 * When to use:
 * Use this executor if you need a specific amount of VUs to complete the same amount of iterations.
 * This can be useful when you have fixed sets of test data that you want to partition between VUs.
 *
 * @example
 *
 * // Execute 20 iterations by 10 VUs each, for a total of 200 iterations, with a maximum duration of 1 hour and 30 minutes:
 * export let options = {
 *    discardResponseBodies: true,
 *    scenarios: {
 *      contacts: {
 *        executor: 'per-vu-iterations',
 *        vus: 10,
 *        iterations: 20,
 *        maxDuration: '1h30m',
 *      }
 *    }
 *  };
 */
export interface PerVUIterationsExecutor extends ScenarioBase {
    executor: 'per-vu-iterations';
    /**
     * Number of VUs to run concurrently.
     * @default 1
     */
    vus?: number;
    /**
     * Total number of script iterations to execute across all VUs.
     * @default 1
     */
    iterations?: number;
    /**
     * Maximum scenario duration before it's forcibly stopped (excluding gracefulStop).
     * @default "10m"
     */
    maxDuration?: string;
}

/**
 * A fixed number of VUs execute as many iterations as possible for a specified amount of time. This executor is equivalent to the global vus and duration options.
 *
 * When to use:
 * Use this executor if you need a specific amount of VUs to run for a certain amount of time.
 *
 * @example
 *
 * // Run a constant 10 VUs for 45 minutes:
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     my_awesome_api_test: {
 *       executor: 'constant-vus',
 *       vus: 10,
 *       duration: '45m',
 *     }
 *   }
 * };
 */
export interface ConstantVUExecutor extends ScenarioBase {
    executor: 'constant-vus';
    /**
     * Number of VUs to run concurrently.
     * @default 1
     */
    vus?: number;
    /**
     * Total scenario duration (excluding gracefulStop).
     */
    duration: string;
}

/**
 * A variable number of VUs execute as many iterations as possible for a specified amount of time. This executor is equivalent to the global stages option.
 *
 * When to use:
 * This executor is a good fit if you need VUs to ramp up or down during specific periods of time.
 *
 * @example
 *
 * // Run a two-stage test, ramping up from 0 to 100 VUs for 5 seconds, and down to 0 VUs for 5 seconds:
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     contacts: {
 *       executor: 'ramping-vus',
 *       startVUs: 0,
 *       stages: [
 *         { duration: '5s', target: 100 },
 *         { duration: '5s', target: 0 },
 *       ],
 *       gracefulRampDown: '0s',
 *     }
 *   }
 * };
 */
export interface RampingVUExecutor extends ScenarioBase {
    executor: 'ramping-vus';
    /**
     * Number of VUs to run at test start.
     * @default 1
     */
    startVUs?: number;
    /**
     * Array of objects that specify the target number of VUs to ramp up or down to.
     * @default []
     */
    stages?: Array<{ duration: string; target: number }>;
    /**
     * Time to wait for iterations to finish before starting new VUs.
     * @default '30s'
     */
    gracefulRampDown?: string;
}

/**
 * A fixed number of iterations are executed in a specified period of time. Since iteration execution time can vary because of test logic or the system-under-test responding more slowly
 * this executor will try to compensate by running a variable number of VUs—including potentially initializing more in the middle of the test—in order to meet the configured iteration rate.
 *
 * This approach is useful for a more accurate representation of RPS, for example.
 *
 * When to use:
 * When you want to maintain a constant number of requests without being affected by the performance of the system under test.
 *
 * @example
 *
 * // Execute a constant 200 RPS for 1 minute, allowing k6 to dynamically schedule up to 100 VUs:
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     contacts: {
 *       executor: 'constant-arrival-rate',
 *       rate: 200,  // 200 RPS, since timeUnit is the default 1s
 *       duration: '1m',
 *       preAllocatedVUs: 50,
 *       maxVUs: 100,
 *     }
 *   }
 * };
 */
export interface ConstantArrivalRateExecutor extends ScenarioBase {
    executor: 'constant-arrival-rate';
    /**
     * Number of iterations to execute each timeUnit period.
     */
    rate: number;
    /**
     * Period of time to apply the rate value.
     * @default '1s'
     */
    timeUnit?: string;
    /**
     * Total scenario duration (excluding gracefulStop).
     */
    duration: string;
    /**
     * Number of VUs to pre-allocate before test start in order to preserve runtime resources.
     */
    preAllocatedVUs: number;
    /**
     * Maximum number of VUs to allow during the test run.
     */
    maxVUs?: number;
}

/**
 * A variable number of iterations are executed in a specified period of time.
 * This is similar to the ramping VUs executor, but for iterations instead, and k6 will attempt to dynamically change the number of VUs to achieve the configured iteration rate.
 *
 * When to use:
 * If you need your tests to not be affected by the system-under-test's performance, and would like to ramp the number of iterations up or down during specific periods of time.
 *
 * @example
 *
 * // Execute a variable RPS test, starting at 50, ramping up to 200 and then back to 0, over a 1 minute period:
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     contacts: {
 *       executor: 'ramping-arrival-rate',
 *       startRate: 50,
 *       timeUnit: '1s',
 *       preAllocatedVUs: 50,
 *       maxVUs: 100,
 *       stages: [
 *         { target: 200, duration: '30s' },
 *         { target: 0, duration: '30s' },
 *       ],
 *     }
 *   }
 * };
 */
export interface RampingArrivalRateExecutor extends ScenarioBase {
    executor: 'ramping-arrival-rate';
    /**
     * Number of iterations to execute each timeUnit period at test start.
     * @default 0
     */
    startRate?: number;
    /**
     * Period of time to apply the startRate the stages target value.
     * @default '1s'
     */
    timeUnit?: string;
    /**
     * Array of objects that specify the target number of iterations to ramp up or down to.
     * @default []
     */
    stages: Array<{ duration: string; target: number }>;
    /**
     * Number of VUs to pre-allocate before test start in order to preserve runtime resources.
     */
    preAllocatedVUs: number;
    /**
     * Maximum number of VUs to allow during the test run.
     */
    maxVUs?: number;
}

/**
 * Control and scale execution at runtime via k6's REST API or the CLI.
 * Previously, the pause, resume, and scale CLI commands were used to globally control k6 execution.
 * This executor does the same job by providing a better API that can be used to control k6 execution at runtime.
 *
 * Note that, passing arguments to the scale CLI command for changing the amount of active or maximum VUs will only affect the externally controlled executor.
 *
 * When to use:
 * If you want to control the number of VUs while the test is running.
 *
 * Important: this is the only executor that is not supported in k6 cloud, it can only be used locally with k6 run.
 *
 * @example
 *
 * export let options = {
 *   discardResponseBodies: true,
 *   scenarios: {
 *     contacts: {
 *       executor: 'externally-controlled',
 *       vus: 0,
 *       maxVUs: 50,
 *       duration: '10m',
 *     }
 *   }
 * };
 */
export interface ExternallyControlledExecutor extends ScenarioBase {
    executor: 'externally-controlled';
    /**
     * Number of VUs to run concurrently.
     */
    vus: number;
    /**
     * Maximum number of VUs to allow during the test run.
     */
    maxVUs?: number;
    /**
     * Total test duration
     */
    duration: string;
}

export type Scenario =
    | SharedIterationsExector
    | PerVUIterationsExecutor
    | ConstantVUExecutor
    | RampingVUExecutor
    | ConstantArrivalRateExecutor
    | RampingArrivalRateExecutor
    | ExternallyControlledExecutor;
