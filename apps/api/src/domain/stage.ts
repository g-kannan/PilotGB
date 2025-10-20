import { Stage } from '@prisma/client';
import { badRequest } from '../errors.js';

export const STAGE_SEQUENCE: Stage[] = [
  Stage.INGESTION,
  Stage.TRANSFORMATION,
  Stage.ENRICHMENT,
  Stage.VALIDATION,
  Stage.VISUALIZATION,
  Stage.DEPLOYMENT,
];

const stageIndex = (stage: Stage): number => STAGE_SEQUENCE.indexOf(stage);

export const getNextStage = (current: Stage): Stage | null => {
  const index = stageIndex(current);
  if (index === -1 || index >= STAGE_SEQUENCE.length - 1) {
    return null;
  }
  return STAGE_SEQUENCE[index + 1];
};

export const ensureValidTransition = (
  current: Stage,
  target: Stage,
  allowRegression = false,
) => {
  const fromIndex = stageIndex(current);
  const toIndex = stageIndex(target);

  if (fromIndex === -1 || toIndex === -1) {
    throw badRequest('Unknown stage transition');
  }

  if (toIndex === fromIndex) {
    throw badRequest('Initiative is already in the requested stage');
  }

  if (toIndex === fromIndex + 1) {
    return;
  }

  if (toIndex > fromIndex + 1) {
    throw badRequest('Cannot skip stages in lifecycle progression');
  }

  if (!allowRegression) {
    throw badRequest('Stage regression is not permitted without override');
  }
};
