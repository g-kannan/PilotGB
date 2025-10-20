import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  AccessStatus,
  AssetType,
  DependencyStatus,
  HealthStatus,
  InitiativeStatus,
  RiskLevel,
  RiskStatus,
  SOWStatus,
  OnboardingStatus,
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

const updateSowSchema = z
  .object({
    summary: z.string().min(10).optional(),
    deliverables: z.string().min(10).optional(),
    status: z.nativeEnum(SOWStatus).optional(),
    pmApproved: z.boolean().optional(),
    architectApproved: z.boolean().optional(),
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
  scopeOfWork: true,
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

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createInitiativeSchema.parse(req.body);

    const initiative = await prisma.$transaction(async (tx) => {
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

      await tx.scopeOfWork.create({
        data: {
          initiativeId: created.id,
          summary:
            'Define project scope, deliverables, and guardrails aligned to the customer engagement.',
          deliverables:
            'Populate during project onboarding. Include lifecycle stages, success metrics, and acceptance criteria.',
          status: SOWStatus.DRAFT,
          pmOwner: payload.projectManager ?? 'TBD Project Manager',
          architectOwner: payload.dataArchitect ?? 'TBD Data Architect',
        },
      });

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

    res.json({ scope: updated });
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

export const initiativesRouter = router;
