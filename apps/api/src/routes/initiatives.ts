import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import {
  AccessStatus,
  AssetType,
  DataComplexity,
  DataSensitivity,
  DependencyStatus,
  HealthStatus,
  InitiativeStatus,
  ModelDeploymentStatus,
  OnboardingStatus,
  ProjectType,
  RiskLevel,
  RiskStatus,
  SOWStatus,
  Stage,
  StageApprovalRole,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { badRequest, notFound } from '../errors.js';
import { ensureValidTransition, STAGE_SEQUENCE } from '../domain/stage.js';

const createInitiativeSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  sowReference: z.string().optional(),
  engagementLead: z.string().optional(),
  projectManager: z.string().optional(),
  dataArchitect: z.string().optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  healthStatus: z.nativeEnum(HealthStatus).default(HealthStatus.HEALTHY),
  riskLevel: z.nativeEnum(RiskLevel).default(RiskLevel.LOW),
  scope: sowInputSchema.optional(),
});

const updateInitiativeSchema = z
  .object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    status: z.nativeEnum(InitiativeStatus).optional(),
    healthStatus: z.nativeEnum(HealthStatus).optional(),
    riskLevel: z.nativeEnum(RiskLevel).optional(),
    sowReference: z.string().optional(),
    engagementLead: z.string().optional(),
    projectManager: z.string().optional(),
    dataArchitect: z.string().optional(),
    startDate: z.coerce.date().optional(),
    targetDate: z.coerce.date().optional(),
  })
  .strict();

const listQuerySchema = z.object({
  stage: z.nativeEnum(Stage).optional(),
  status: z.nativeEnum(InitiativeStatus).optional(),
  healthStatus: z.nativeEnum(HealthStatus).optional(),
});

const transitionSchema = z.object({
  targetStage: z.nativeEnum(Stage),
  reason: z.string().max(500).optional(),
  actor: z.string().max(120).optional(),
  allowRegression: z.boolean().optional(),
});

const checklistUpdateSchema = z.object({
  completed: z.boolean(),
});

const createAssetSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(AssetType),
  ownerTeam: z.string().min(2),
  steward: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  notes: z.string().optional(),
});

const createRiskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  severity: z.nativeEnum(RiskLevel),
  status: z.nativeEnum(RiskStatus).default(RiskStatus.OPEN),
  mitigationPlan: z.string().optional(),
  owner: z.string().optional(),
});

const updateRiskSchema = z.object({
  status: z.nativeEnum(RiskStatus).optional(),
  mitigationPlan: z.string().optional(),
  owner: z.string().optional(),
  resolvedAt: z.coerce.date().optional(),
});

const createDependencySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.string().min(2),
  externalSystem: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.nativeEnum(DependencyStatus).default(DependencyStatus.OPEN),
});

const dataMetricsSchema = z
  .object({
    dataSources: z.coerce.number().int().min(0).optional(),
    tables: z.coerce.number().int().min(0).optional(),
    pipelines: z.coerce.number().int().min(0).optional(),
    dashboards: z.coerce.number().int().min(0).optional(),
    models: z.coerce.number().int().min(0).optional(),
    volumeTb: z.coerce.number().min(0).optional(),
    complexity: z.nativeEnum(DataComplexity).optional(),
    sensitivity: z.nativeEnum(DataSensitivity).optional(),
  })
  .strict();

const aiMetricsSchema = z
  .object({
    modelType: z.string().optional(),
    useCase: z.string().optional(),
    baselineAccuracy: z.coerce.number().min(0).max(100).optional(),
    targetAccuracy: z.coerce.number().min(0).max(100).optional(),
    trainingDataTb: z.coerce.number().min(0).optional(),
    featureCount: z.coerce.number().int().min(0).optional(),
    trainingIterations: z.coerce.number().int().min(0).optional(),
    deploymentStatus: z.nativeEnum(ModelDeploymentStatus).optional(),
    monitoringKpis: z.string().optional(),
  })
  .strict();

const updateSowSchema = z
  .object({
    summary: z.string().min(10).optional(),
    deliverables: z.string().min(10).optional(),
    status: z.nativeEnum(SOWStatus).optional(),
    pmApproved: z.boolean().optional(),
    architectApproved: z.boolean().optional(),
    projectType: z.nativeEnum(ProjectType).optional(),
    dataMetrics: dataMetricsSchema.optional(),
    aiMetrics: aiMetricsSchema.optional(),
  })
  .refine(
    (data) =>
      !(
        data.status &&
        data.status === SOWStatus.SIGNED_OFF &&
        (data.pmApproved === false || data.architectApproved === false)
      ),
    {
      message: 'SOW cannot be signed off without both approvals.',
      path: ['status'],
    },
  );

const approvalUpdateSchema = z.object({
  approved: z.boolean(),
  approvedBy: z.string().min(2).optional(),
  notes: z.string().optional(),
});

const accessUpdateSchema = z.object({
  status: z.nativeEnum(AccessStatus).optional(),
  notes: z.string().optional(),
  fulfilled: z.boolean().optional(),
});

const onboardingUpdateSchema = z.object({
  onboardingStatus: z.nativeEnum(OnboardingStatus),
  startDate: z.coerce.date().optional(),
});

const assignmentCreateSchema = z.object({
  memberId: z.string().cuid(),
  responsibility: z.string().min(2),
});

const sowInputSchema = z
  .object({
    summary: z.string().min(10),
    deliverables: z.string().min(10),
    projectType: z.nativeEnum(ProjectType).default(ProjectType.DATA),
    dataMetrics: dataMetricsSchema.optional(),
    aiMetrics: aiMetricsSchema.optional(),
  })
  .strict();

const REQUIRED_APPROVAL_ROLES: StageApprovalRole[] = [
  StageApprovalRole.PROJECT_MANAGER,
  StageApprovalRole.DATA_ARCHITECT,
];

const initiativeInclude = {
  assets: true,
  risks: true,
  dependencies: true,
  checklistItems: true,
  stageHistory: {
    orderBy: { createdAt: 'asc' as const },
  },
  approvals: true,
  scopeOfWork: {
    include: {
      dataMetrics: true,
      aiMetrics: true,
    },
  },
  assignments: {
    include: {
      member: true,
    },
  },
  accessRequests: {
    include: {
      member: true,
    },
    orderBy: { requestedAt: 'desc' as const },
  },
};

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    const initiatives = await prisma.initiative.findMany({
      where: {
        stage: filters.stage,
        status: filters.status,
        healthStatus: filters.healthStatus,
      },
      include: initiativeInclude,
      orderBy: [
        { status: 'asc' },
        { riskLevel: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      initiatives,
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
      include: initiativeInclude,
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    res.json({ initiative });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      await prisma.initiative.delete({
        where: { id: req.params.id },
      });
    } catch {
      throw notFound('Initiative not found');
    }

    res.status(204).send();
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createInitiativeSchema.parse(req.body);

    const initiative = await prisma.$transaction(async (tx) => {
      const scopeInput = payload.scope ?? {
        summary:
          'Define project scope, deliverables, and guardrails aligned to the customer engagement.',
        deliverables:
          'Populate during project onboarding. Include lifecycle stages, success metrics, and acceptance criteria.',
        projectType: ProjectType.DATA,
      };

      const created = await tx.initiative.create({
        data: {
          name: payload.name,
          description: payload.description,
          sowReference: payload.sowReference,
          engagementLead: payload.engagementLead,
          projectManager: payload.projectManager,
          dataArchitect: payload.dataArchitect,
          startDate: payload.startDate,
          targetDate: payload.targetDate,
          healthStatus: payload.healthStatus,
          riskLevel: payload.riskLevel,
          checklistItems: {
            create: STAGE_SEQUENCE.map((stage) => ({
              stage,
              title: `${stage} exit gate`,
              description: `Confirm ${stage.toLowerCase()} stage exit criteria.`,
            })),
          },
          stageHistory: {
            create: {
              fromStage: null,
              toStage: Stage.INGESTION,
              actor: 'system',
              reason: 'Initiative created',
            },
          },
        },
      });

      const scope = await tx.scopeOfWork.create({
        data: {
          initiativeId: created.id,
          summary: scopeInput.summary,
          deliverables: scopeInput.deliverables,
          status: SOWStatus.DRAFT,
          projectType: scopeInput.projectType ?? ProjectType.DATA,
          pmOwner: payload.projectManager ?? 'Unassigned PM',
          architectOwner: payload.dataArchitect ?? 'Unassigned Architect',
        },
      });

      if (scopeInput.dataMetrics) {
        await tx.dataScopeMetrics.create({
          data: {
            scopeOfWorkId: scope.id,
            dataSources: scopeInput.dataMetrics.dataSources ?? 0,
            tables: scopeInput.dataMetrics.tables ?? 0,
            pipelines: scopeInput.dataMetrics.pipelines ?? 0,
            dashboards: scopeInput.dataMetrics.dashboards ?? 0,
            models: scopeInput.dataMetrics.models ?? 0,
            volumeTb: scopeInput.dataMetrics.volumeTb ?? 0,
            complexity:
              scopeInput.dataMetrics.complexity ?? DataComplexity.MEDIUM,
            sensitivity:
              scopeInput.dataMetrics.sensitivity ?? DataSensitivity.INTERNAL,
          },
        });
      }

      if (scopeInput.aiMetrics) {
        await tx.aiScopeMetrics.create({
          data: {
            scopeOfWorkId: scope.id,
            modelType: scopeInput.aiMetrics.modelType ?? null,
            useCase: scopeInput.aiMetrics.useCase ?? null,
            baselineAccuracy: scopeInput.aiMetrics.baselineAccuracy ?? null,
            targetAccuracy: scopeInput.aiMetrics.targetAccuracy ?? null,
            trainingDataTb: scopeInput.aiMetrics.trainingDataTb ?? null,
            featureCount: scopeInput.aiMetrics.featureCount ?? null,
            trainingIterations: scopeInput.aiMetrics.trainingIterations ?? null,
            deploymentStatus:
              scopeInput.aiMetrics.deploymentStatus ??
              ModelDeploymentStatus.IDEATION,
            monitoringKpis: scopeInput.aiMetrics.monitoringKpis ?? null,
          },
        });
      }

      await tx.stageApproval.createMany({
        data: STAGE_SEQUENCE.flatMap((stage) =>
          REQUIRED_APPROVAL_ROLES.map((role) => ({
            initiativeId: created.id,
            stage,
            role,
          })),
        ),
      });

      return tx.initiative.findUniqueOrThrow({
        where: { id: created.id },
        include: initiativeInclude,
      });
    });

    res.status(201).json({ initiative });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = updateInitiativeSchema.parse(req.body);

    const initiative = await prisma.$transaction(async (tx) => {
      await tx.initiative.update({
        where: { id: req.params.id },
        data: {
          ...payload,
        },
      });

      if (payload.projectManager || payload.dataArchitect) {
        const scope = await tx.scopeOfWork.findUnique({
          where: { initiativeId: req.params.id },
        });

        if (scope) {
          await tx.scopeOfWork.update({
            where: { initiativeId: req.params.id },
            data: {
              pmOwner: payload.projectManager ?? scope.pmOwner,
              architectOwner: payload.dataArchitect ?? scope.architectOwner,
            },
          });
        }
      }

      return tx.initiative.findUniqueOrThrow({
        where: { id: req.params.id },
        include: initiativeInclude,
      });
    });

    res.json({ initiative });
  }),
);

router.post(
  '/:id/transition',
  asyncHandler(async (req, res) => {
    const { targetStage, reason, actor, allowRegression } =
      transitionSchema.parse(req.body);

    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
      include: {
        checklistItems: true,
        scopeOfWork: true,
        approvals: true,
      },
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    ensureValidTransition(
      initiative.stage,
      targetStage,
      allowRegression ?? false,
    );

    if (
      initiative.scopeOfWork &&
      initiative.stage === Stage.INGESTION &&
      ![SOWStatus.APPROVED, SOWStatus.SIGNED_OFF].includes(
        initiative.scopeOfWork.status,
      )
    ) {
      throw badRequest(
        'Scope of Work must be approved by PM and Data Architect before progressing beyond Ingestion.',
      );
    }

    if (
      initiative.scopeOfWork &&
      targetStage === Stage.DEPLOYMENT &&
      initiative.scopeOfWork.status !== SOWStatus.SIGNED_OFF
    ) {
      throw badRequest(
        'Scope of Work must be fully signed off before deployment.',
      );
    }

    const currentStageApprovals = initiative.approvals.filter(
      (approval) => approval.stage === initiative.stage,
    );

    const missingApprovals = REQUIRED_APPROVAL_ROLES.filter(
      (role) =>
        !currentStageApprovals.some(
          (approval) => approval.role === role && approval.approved,
        ),
    );

    if (missingApprovals.length > 0) {
      throw badRequest('Stage progression requires approvals.', {
        missingApprovals,
      });
    }

    if (!allowRegression) {
      const incomplete = initiative.checklistItems.filter(
        (check) => check.stage === initiative.stage && !check.completed,
      );

      if (incomplete.length > 0) {
        throw badRequest(
          'Cannot advance stage until all exit checklist items are completed.',
          incomplete.map((item) => ({
            id: item.id,
            title: item.title,
          })),
        );
      }
    }

    const nextStatus =
      targetStage === Stage.DEPLOYMENT
        ? InitiativeStatus.COMPLETE
        : initiative.status === InitiativeStatus.COMPLETE
        ? InitiativeStatus.ON_TRACK
        : initiative.status;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stageHistory.create({
        data: {
          initiativeId: initiative.id,
          fromStage: initiative.stage,
          toStage: targetStage,
          reason,
          actor: actor ?? 'system',
        },
      });

      await tx.stageApproval.updateMany({
        where: {
          initiativeId: initiative.id,
          stage: targetStage,
        },
        data: {
          approved: false,
          approvedAt: null,
          approvedBy: null,
          notes: null,
        },
      });

      return tx.initiative.update({
        where: { id: initiative.id },
        data: {
          stage: targetStage,
          status: nextStatus,
        },
        include: initiativeInclude,
      });
    });

    res.json({ initiative: updated });
  }),
);

router.patch(
  '/:id/checklists/:checklistId',
  asyncHandler(async (req, res) => {
    const payload = checklistUpdateSchema.parse(req.body);

    const checklist = await prisma.stageChecklistItem.findUnique({
      where: { id: req.params.checklistId },
    });

    if (!checklist || checklist.initiativeId !== req.params.id) {
      throw notFound('Checklist item not found');
    }

    const updated = await prisma.stageChecklistItem.update({
      where: { id: checklist.id },
      data: {
        completed: payload.completed,
        completedAt: payload.completed ? new Date() : null,
      },
    });

    res.json({ checklist: updated });
  }),
);

router.get(
  '/:id/assets',
  asyncHandler(async (req, res) => {
    const assets = await prisma.dataAsset.findMany({
      where: { initiativeId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ assets });
  }),
);

router.post(
  '/:id/assets',
  asyncHandler(async (req, res) => {
    const payload = createAssetSchema.parse(req.body);

    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    const asset = await prisma.dataAsset.create({
      data: {
        ...payload,
        initiativeId: req.params.id,
      },
    });

    res.status(201).json({ asset });
  }),
);

router.get(
  '/:id/risks',
  asyncHandler(async (req, res) => {
    const risks = await prisma.risk.findMany({
      where: { initiativeId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ risks });
  }),
);

router.post(
  '/:id/risks',
  asyncHandler(async (req, res) => {
    const payload = createRiskSchema.parse(req.body);

    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    const risk = await prisma.risk.create({
      data: {
        ...payload,
        initiativeId: req.params.id,
      },
    });

    res.status(201).json({ risk });
  }),
);

router.patch(
  '/:id/risks/:riskId',
  asyncHandler(async (req, res) => {
    const payload = updateRiskSchema.parse(req.body);

    const risk = await prisma.risk.findUnique({
      where: { id: req.params.riskId },
    });

  if (!risk || risk.initiativeId !== req.params.id) {
    throw notFound('Risk not found');
  }

    const updates: Prisma.RiskUpdateInput = {
      ...payload,
    };

    if (payload.status === RiskStatus.CLOSED && !payload.resolvedAt) {
      updates.resolvedAt = new Date();
    } else if (payload.resolvedAt) {
      updates.resolvedAt = payload.resolvedAt;
    }

    const updated = await prisma.risk.update({
      where: { id: risk.id },
    data: updates,
    });

    res.json({ risk: updated });
  }),
);

router.get(
  '/:id/dependencies',
  asyncHandler(async (req, res) => {
    const dependencies = await prisma.dependency.findMany({
      where: { initiativeId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ dependencies });
  }),
);

router.post(
  '/:id/dependencies',
  asyncHandler(async (req, res) => {
    const payload = createDependencySchema.parse(req.body);

    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    const dependency = await prisma.dependency.create({
      data: {
        ...payload,
        initiativeId: req.params.id,
      },
    });

    res.status(201).json({ dependency });
  }),
);

router.get(
  '/:id/sow',
  asyncHandler(async (req, res) => {
    const scope = await prisma.scopeOfWork.findUnique({
      where: { initiativeId: req.params.id },
      include: {
        dataMetrics: true,
        aiMetrics: true,
      },
    });

    if (!scope) {
      throw notFound('Scope of Work not found');
    }

    const approvals = await prisma.stageApproval.findMany({
      where: { initiativeId: req.params.id },
      orderBy: [{ stage: 'asc' }, { role: 'asc' }],
    });

    res.json({ scope, approvals });
  }),
);

router.patch(
  '/:id/sow',
  asyncHandler(async (req, res) => {
    const payload = updateSowSchema.parse(req.body);

    const scope = await prisma.scopeOfWork.findUnique({
      where: { initiativeId: req.params.id },
    });

    if (!scope) {
      throw notFound('Scope of Work not found');
    }

    const updates: Prisma.ScopeOfWorkUpdateInput = {
      lastReviewedAt: new Date(),
    };

    if (payload.summary !== undefined) {
      updates.summary = payload.summary;
    }
    if (payload.deliverables !== undefined) {
      updates.deliverables = payload.deliverables;
    }
    if (payload.projectType !== undefined) {
      updates.projectType = payload.projectType;
    }
    if (payload.status !== undefined) {
      updates.status = payload.status;
      updates.signedOffAt =
        payload.status === SOWStatus.SIGNED_OFF ? new Date() : null;
    }
    if (payload.pmApproved !== undefined) {
      updates.pmApproved = payload.pmApproved;
      updates.pmApprovedAt = payload.pmApproved ? new Date() : null;
    }
    if (payload.architectApproved !== undefined) {
      updates.architectApproved = payload.architectApproved;
      updates.architectApprovedAt = payload.architectApproved
        ? new Date()
        : null;
    }

    if (
      (payload.pmApproved || payload.architectApproved) &&
      scope.status === SOWStatus.DRAFT &&
      (payload.pmApproved || scope.pmApproved) &&
      (payload.architectApproved || scope.architectApproved) &&
      payload.status === undefined
    ) {
      updates.status = SOWStatus.APPROVED;
    }

    const updated = await prisma.scopeOfWork.update({
      where: { initiativeId: req.params.id },
      data: updates,
    });

    const hasDataMetricsUpdate =
      payload.dataMetrics &&
      Object.values(payload.dataMetrics).some(
        (value) => value !== undefined && value !== null,
      );

    if (hasDataMetricsUpdate) {
      const dataMetrics = await prisma.dataScopeMetrics.findUnique({
        where: { scopeOfWorkId: updated.id },
      });
      if (dataMetrics) {
        const updateData: Prisma.DataScopeMetricsUpdateInput = {};
        if (payload.dataMetrics?.dataSources !== undefined) {
          updateData.dataSources = payload.dataMetrics.dataSources;
        }
        if (payload.dataMetrics?.tables !== undefined) {
          updateData.tables = payload.dataMetrics.tables;
        }
        if (payload.dataMetrics?.pipelines !== undefined) {
          updateData.pipelines = payload.dataMetrics.pipelines;
        }
        if (payload.dataMetrics?.dashboards !== undefined) {
          updateData.dashboards = payload.dataMetrics.dashboards;
        }
        if (payload.dataMetrics?.models !== undefined) {
          updateData.models = payload.dataMetrics.models;
        }
        if (payload.dataMetrics?.volumeTb !== undefined) {
          updateData.volumeTb = payload.dataMetrics.volumeTb;
        }
        if (payload.dataMetrics?.complexity !== undefined) {
          updateData.complexity = payload.dataMetrics.complexity;
        }
        if (payload.dataMetrics?.sensitivity !== undefined) {
          updateData.sensitivity = payload.dataMetrics.sensitivity;
        }

        await prisma.dataScopeMetrics.update({
          where: { scopeOfWorkId: updated.id },
          data: updateData,
        });
      } else {
        await prisma.dataScopeMetrics.create({
          data: {
            scopeOfWorkId: updated.id,
            dataSources: payload.dataMetrics?.dataSources ?? 0,
            tables: payload.dataMetrics?.tables ?? 0,
            pipelines: payload.dataMetrics?.pipelines ?? 0,
            dashboards: payload.dataMetrics?.dashboards ?? 0,
            models: payload.dataMetrics?.models ?? 0,
            volumeTb: payload.dataMetrics?.volumeTb ?? 0,
            complexity:
              payload.dataMetrics?.complexity ?? DataComplexity.MEDIUM,
            sensitivity:
              payload.dataMetrics?.sensitivity ?? DataSensitivity.INTERNAL,
          },
        });
      }
    }

    const hasAiMetricsUpdate =
      payload.aiMetrics &&
      Object.values(payload.aiMetrics).some(
        (value) => value !== undefined && value !== null,
      );

    if (hasAiMetricsUpdate) {
      const aiMetrics = await prisma.aiScopeMetrics.findUnique({
        where: { scopeOfWorkId: updated.id },
      });

      const aiPayload = payload.aiMetrics ?? {};

      if (aiMetrics) {
        const updateData: Prisma.AiScopeMetricsUpdateInput = {};
        if (aiPayload.modelType !== undefined) {
          updateData.modelType = aiPayload.modelType;
        }
        if (aiPayload.useCase !== undefined) {
          updateData.useCase = aiPayload.useCase;
        }
        if (aiPayload.baselineAccuracy !== undefined) {
          updateData.baselineAccuracy = aiPayload.baselineAccuracy;
        }
        if (aiPayload.targetAccuracy !== undefined) {
          updateData.targetAccuracy = aiPayload.targetAccuracy;
        }
        if (aiPayload.trainingDataTb !== undefined) {
          updateData.trainingDataTb = aiPayload.trainingDataTb;
        }
        if (aiPayload.featureCount !== undefined) {
          updateData.featureCount = aiPayload.featureCount;
        }
        if (aiPayload.trainingIterations !== undefined) {
          updateData.trainingIterations = aiPayload.trainingIterations;
        }
        if (aiPayload.deploymentStatus !== undefined) {
          updateData.deploymentStatus = aiPayload.deploymentStatus;
        }
        if (aiPayload.monitoringKpis !== undefined) {
          updateData.monitoringKpis = aiPayload.monitoringKpis;
        }

        await prisma.aiScopeMetrics.update({
          where: { scopeOfWorkId: updated.id },
          data: updateData,
        });
      } else {
        await prisma.aiScopeMetrics.create({
          data: {
            scopeOfWorkId: updated.id,
            modelType: aiPayload.modelType ?? null,
            useCase: aiPayload.useCase ?? null,
            baselineAccuracy: aiPayload.baselineAccuracy ?? null,
            targetAccuracy: aiPayload.targetAccuracy ?? null,
            trainingDataTb: aiPayload.trainingDataTb ?? null,
            featureCount: aiPayload.featureCount ?? null,
            trainingIterations: aiPayload.trainingIterations ?? null,
            deploymentStatus:
              aiPayload.deploymentStatus ?? ModelDeploymentStatus.IDEATION,
            monitoringKpis: aiPayload.monitoringKpis ?? null,
          },
        });
      }
    }

    const refreshed = await prisma.scopeOfWork.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        dataMetrics: true,
        aiMetrics: true,
      },
    });

    res.json({ scope: refreshed });
  }),
);

router.patch(
  '/:id/approvals/:approvalId',
  asyncHandler(async (req, res) => {
    const payload = approvalUpdateSchema.parse(req.body);

    const approval = await prisma.stageApproval.findUnique({
      where: { id: req.params.approvalId },
    });

    if (!approval || approval.initiativeId !== req.params.id) {
      throw notFound('Stage approval not found');
    }

    if (payload.approved && !payload.approvedBy) {
      throw badRequest('Approver name is required when approving a stage.');
    }

    const data: Prisma.StageApprovalUpdateInput = {
      approved: payload.approved,
      notes: payload.notes ?? null,
    };

    if (payload.approved) {
      data.approvedBy = payload.approvedBy;
      data.approvedAt = new Date();
    } else {
      data.approvedBy = null;
      data.approvedAt = null;
    }

    const updated = await prisma.stageApproval.update({
      where: { id: approval.id },
      data,
    });

    res.json({ approval: updated });
  }),
);

router.patch(
  '/:id/access/:accessId',
  asyncHandler(async (req, res) => {
    const payload = accessUpdateSchema.parse(req.body);

    const access = await prisma.accessProvision.findUnique({
      where: { id: req.params.accessId },
      include: { member: true },
    });

    if (!access || access.initiativeId !== req.params.id) {
      throw notFound('Access request not found');
    }

    const updates: Prisma.AccessProvisionUpdateInput = {
      notes: payload.notes ?? access.notes ?? null,
    };

    if (payload.status) {
      updates.status = payload.status;
      if (payload.status === AccessStatus.GRANTED && !access.fulfilledAt) {
        updates.fulfilledAt = new Date();
      }
      if (payload.status !== AccessStatus.GRANTED) {
        updates.fulfilledAt = null;
      }
    }

    if (payload.fulfilled !== undefined) {
      updates.fulfilledAt = payload.fulfilled ? new Date() : null;
      if (payload.fulfilled && !payload.status) {
        updates.status = AccessStatus.GRANTED;
      }
    }

    const updated = await prisma.accessProvision.update({
      where: { id: access.id },
      data: updates,
    });

    res.json({ access: updated });
  }),
);

router.post(
  '/:id/team-members',
  asyncHandler(async (req, res) => {
    const payload = assignmentCreateSchema.parse(req.body);

    const initiative = await prisma.initiative.findUnique({
      where: { id: req.params.id },
    });

    if (!initiative) {
      throw notFound('Initiative not found');
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: payload.memberId },
    });

    if (!member) {
      throw notFound('Team member not found');
    }

    try {
      const assignment = await prisma.initiativeAssignment.create({
        data: {
          initiativeId: initiative.id,
          memberId: payload.memberId,
          responsibility: payload.responsibility,
        },
        include: {
          member: true,
        },
      });

      res.status(201).json({ assignment });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw badRequest('Team member already assigned to this initiative.');
      }
      throw error;
    }
  }),
);

router.patch(
  '/:id/team-members/:memberId',
  asyncHandler(async (req, res) => {
    const payload = onboardingUpdateSchema.parse(req.body);

    const assignment = await prisma.initiativeAssignment.findUnique({
      where: {
        initiativeId_memberId: {
          initiativeId: req.params.id,
          memberId: req.params.memberId,
        },
      },
      include: {
        member: true,
      },
    });

    if (!assignment) {
      throw notFound('Team member assignment not found for this initiative');
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: req.params.memberId },
      data: {
        onboardingStatus: payload.onboardingStatus,
        startDate: payload.startDate ?? assignment.member.startDate,
      },
    });

    res.json({ member: updatedMember });
  }),
);

router.delete(
  '/:id/team-members/:memberId',
  asyncHandler(async (req, res) => {
    try {
      await prisma.initiativeAssignment.delete({
        where: {
          initiativeId_memberId: {
            initiativeId: req.params.id,
            memberId: req.params.memberId,
          },
        },
      });
    } catch {
      throw notFound('Team member assignment not found for this initiative');
    }

    res.status(204).send();
  }),
);

export const initiativesRouter = router;
