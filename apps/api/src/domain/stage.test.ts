/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import { Stage } from '@prisma/client';
import { ensureValidTransition, getNextStage, STAGE_SEQUENCE } from './stage.js';

describe('stage helpers', () => {
  it('returns the next stage in the lifecycle', () => {
    expect(getNextStage(Stage.INGESTION)).toBe(Stage.TRANSFORMATION);
    expect(getNextStage(Stage.DEPLOYMENT)).toBeNull();
  });

  it('allows forward-only transitions by default', () => {
    expect(() =>
      ensureValidTransition(Stage.INGESTION, Stage.TRANSFORMATION),
    ).not.toThrow();
  });

  it('rejects stage skips', () => {
    expect(() =>
      ensureValidTransition(Stage.INGESTION, Stage.ENRICHMENT),
    ).toThrow(/Cannot skip stages/);
  });

  it('allows regression when explicitly enabled', () => {
    expect(() =>
      ensureValidTransition(Stage.ENRICHMENT, Stage.TRANSFORMATION, true),
    ).not.toThrow();
  });

  it('sequence contains all lifecycle stages', () => {
    expect(STAGE_SEQUENCE).toEqual([
      Stage.INGESTION,
      Stage.TRANSFORMATION,
      Stage.ENRICHMENT,
      Stage.VALIDATION,
      Stage.VISUALIZATION,
      Stage.DEPLOYMENT,
    ]);
  });
});
