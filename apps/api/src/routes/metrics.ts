import { Router } from 'express';
import {
  DependencyStatus,
  HealthStatus,
  InitiativeStatus,
  RiskLevel,
  RiskStatus,
} from '@prisma/client';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { STAGE_SEQUENCE } from '../domain/stage.js';

const router = Router();

const daysBetween = (start: Date, end: Date) =>
  Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const initiatives = await prisma.initiative.findMany({
      include: {
        stageHistory: { orderBy: { createdAt: 'asc' } },
        risks: true,
      },
    });

    const byStage = Object.fromEntries(
      STAGE_SEQUENCE.map((stage) => [
        stage,
        initiatives.filter((initiative) => initiative.stage === stage).length,
      ]),
    );

    const byStatus = Object.fromEntries(
      Object.values(InitiativeStatus).map((status) => [
        status,
        initiatives.filter((initiative) => initiative.status === status).length,
      ]),
    );

    const health = Object.fromEntries(
      Object.values(HealthStatus).map((status) => [
        status,
        initiatives.filter(
          (initiative) => initiative.healthStatus === status,
        ).length,
      ]),
    );

    const riskHotspots = initiatives.flatMap((initiative) =>
      initiative.risks
        .filter(
          (risk) =>
            (risk.severity === RiskLevel.HIGH ||
              risk.severity === RiskLevel.CRITICAL) &&
            risk.status === RiskStatus.OPEN,
        )
        .map((risk) => ({
          initiativeId: initiative.id,
          initiativeName: initiative.name,
          riskId: risk.id,
          riskTitle: risk.title,
          severity: risk.severity,
        })),
    );

    const blockedDependencies = await prisma.dependency.count({
      where: { status: DependencyStatus.BLOCKED },
    });

    const overdueInitiatives = initiatives.filter(
      (initiative) =>
        initiative.targetDate &&
        initiative.targetDate < new Date() &&
        initiative.status !== InitiativeStatus.COMPLETE,
    );

    const cycleDurations = initiatives
      .map((initiative) => {
        if (initiative.stageHistory.length < 2) {
          return null;
        }

        const first = initiative.stageHistory[0];
        const last = initiative.stageHistory[initiative.stageHistory.length - 1];

        return daysBetween(first.createdAt, last.createdAt);
      })
      .filter((duration): duration is number => duration !== null);

    const averageCycleTimeDays =
      cycleDurations.length > 0
        ? Math.round(
            cycleDurations.reduce((acc, value) => acc + value, 0) /
              cycleDurations.length,
          )
        : null;

    res.json({
      metrics: {
        byStage,
        byStatus,
        health,
        riskHotspots,
        blockedDependencies,
        overdueInitiatives: overdueInitiatives.length,
        averageCycleTimeDays,
      },
    });
  }),
);

export const metricsRouter = router;
