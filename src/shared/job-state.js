export const JOB_STATES=Object.freeze(['queued','starting','downloading','merging','complete','failed','cancelled']);
export const BUSY_STATES=Object.freeze(new Set(['queued','starting','downloading','merging']));
export function isBusy(state){return BUSY_STATES.has(state);}
export function publicJob(job){if(!job)return null;const {tabId,...safe}=job;return safe;}
