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
  PrismaClient,
  ProjectType,
  RiskLevel,
  RiskStatus,
  SOWStatus,
  Stage,
  StageApprovalRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const stageSequence: Stage[] = [
  Stage.INGESTION,
  Stage.TRANSFORMATION,
  Stage.ENRICHMENT,
  Stage.VALIDATION,
  Stage.VISUALIZATION,
  Stage.DEPLOYMENT,
];

const approvalRoles: StageApprovalRole[] = [
  StageApprovalRole.PROJECT_MANAGER,
  StageApprovalRole.DATA_ARCHITECT,
];

async function seedInitiatives() {
  const teamMemberSeeds = [
    {
      key: 'projectManager',
      data: {
        name: 'Morgan Lee',
        email: 'morgan.lee@pilotgb.io',
        roleTitle: 'Project Manager',
        team: 'PMO',
        onboardingStatus: OnboardingStatus.COMPLETED,
        startDate: new Date('2024-12-01'),
      },
    },
    {
      key: 'dataArchitect',
      data: {
        name: 'Elena Park',
        email: 'elena.park@pilotgb.io',
        roleTitle: 'Lead Data Architect',
        team: 'Data Platform',
        onboardingStatus: OnboardingStatus.COMPLETED,
        startDate: new Date('2023-10-15'),
      },
    },
    {
      key: 'analyticsEngineer',
      data: {
        name: 'Jared Kim',
        email: 'jared.kim@pilotgb.io',
        roleTitle: 'Analytics Engineer',
        team: 'Analytics Engineering',
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
        startDate: new Date('2025-02-10'),
      },
    },
    {
      key: 'dataEngineer',
      data: {
        name: 'Lucia Mendes',
        email: 'lucia.mendes@pilotgb.io',
        roleTitle: 'Data Engineer',
        team: 'Data Engineering',
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
        startDate: new Date('2025-03-01'),
      },
    },
    {
      key: 'qualityLead',
      data: {
        name: 'Rahul Patel',
        email: 'rahul.patel@pilotgb.io',
        roleTitle: 'Data Quality Lead',
        team: 'Governance',
        onboardingStatus: OnboardingStatus.AWAITING,
      },
    },
  ] as const;

  type MemberKey = (typeof teamMemberSeeds)[number]['key'];
  type MemberRecord = Record<
    MemberKey,
    Awaited<ReturnType<typeof prisma.teamMember.create>>
  >;
  const members = {} as MemberRecord;

  for (const seed of teamMemberSeeds) {
    members[seed.key] = await prisma.teamMember.create({ data: seed.data });
  }

  type InitiativeSeed = {
    base: {
      name: string;
      description: string;
      stage: Stage;
      status: InitiativeStatus;
      healthStatus: HealthStatus;
      riskLevel: RiskLevel;
      sowReference: string;
      engagementLead: string;
      projectManager: string;
      dataArchitect: string;
      startDate: Date;
      targetDate: Date;
    };
    checklistCompletedStages: Stage[];
    scope: {
      status: SOWStatus;
      projectType: ProjectType;
      pmApproved: boolean;
      pmApprovedAt: Date | null;
      architectApproved: boolean;
      architectApprovedAt: Date | null;
      signedOffAt: Date | null;
      summary: string;
      deliverables: string;
      dataMetrics?: {
        dataSources: number;
        tables: number;
        pipelines: number;
        dashboards: number;
        models: number;
        volumeTb: number;
        complexity: DataComplexity;
        sensitivity: DataSensitivity;
      };
      aiMetrics?: {
        modelType?: string;
        useCase?: string;
        baselineAccuracy?: number;
        targetAccuracy?: number;
        trainingDataTb?: number;
        featureCount?: number;
        trainingIterations?: number;
        deploymentStatus: ModelDeploymentStatus;
        monitoringKpis?: string;
      };
    };
    access: Array<{
      member: MemberKey;
      systemName: string;
      status: AccessStatus;
      fulfilledAt?: Date | null;
      notes?: string;
    }>;
  };

  const initiatives: InitiativeSeed[] = [
    {
      base: {
        name: 'Customer 360 Enrichment',
        description:
          'Unify CRM, support, and product telemetry to power a holistic customer experience dashboard.',
        stage: Stage.ENRICHMENT,
        status: InitiativeStatus.AT_RISK,
        healthStatus: HealthStatus.WATCH,
        riskLevel: RiskLevel.MEDIUM,
        sowReference: 'SOW-ACME-2025-01',
        engagementLead: 'Dana Waters',
        projectManager: members.projectManager.name,
        dataArchitect: members.dataArchitect.name,
        startDate: new Date('2025-01-15'),
        targetDate: new Date('2025-06-30'),
      },
      checklistCompletedStages: [Stage.INGESTION, Stage.TRANSFORMATION, Stage.ENRICHMENT],
    scope: {
      status: SOWStatus.APPROVED,
      projectType: ProjectType.DATA,
      pmApproved: true,
      pmApprovedAt: new Date('2025-01-20'),
      architectApproved: true,
      architectApprovedAt: new Date('2025-01-22'),
      signedOffAt: null,
      summary:
        'Scope includes ingestion through enrichment of customer telemetry tied to executive dashboards.',
      deliverables:
        'Golden customer dataset, unified identity graph, production-ready Looker dashboard, runbook.',
      dataMetrics: {
        dataSources: 6,
        tables: 24,
        pipelines: 8,
        dashboards: 5,
        models: 2,
        volumeTb: 1.8,
        complexity: DataComplexity.HIGH,
        sensitivity: DataSensitivity.CONFIDENTIAL,
      },
    },
      access: [
        {
          member: 'analyticsEngineer',
          systemName: 'dbt Cloud Workspace',
          status: AccessStatus.GRANTED,
          fulfilledAt: new Date('2025-02-05'),
          notes: 'Granted by platform operations.',
        },
        {
          member: 'dataEngineer',
          systemName: 'Airflow Scheduler',
          status: AccessStatus.IN_PROGRESS,
          notes: 'Awaiting security review completion.',
        },
        {
          member: 'qualityLead',
          systemName: 'Data Quality Portal',
          status: AccessStatus.REQUESTED,
        },
      ],
    },
    {
      base: {
        name: 'Financial Data Trust Validation',
        description:
          'Automate validation gates for finance warehouse ensuring monthly close accuracy.',
        stage: Stage.VALIDATION,
        status: InitiativeStatus.ON_TRACK,
        healthStatus: HealthStatus.HEALTHY,
        riskLevel: RiskLevel.LOW,
        sowReference: 'SOW-FIN-2025-04',
        engagementLead: 'Christopher Lane',
        projectManager: members.projectManager.name,
        dataArchitect: members.dataArchitect.name,
        startDate: new Date('2025-02-01'),
        targetDate: new Date('2025-05-30'),
      },
      checklistCompletedStages: stageSequence.slice(0, 4),
    scope: {
      status: SOWStatus.SIGNED_OFF,
      projectType: ProjectType.DATA,
      pmApproved: true,
      pmApprovedAt: new Date('2025-02-05'),
      architectApproved: true,
      architectApprovedAt: new Date('2025-02-06'),
      signedOffAt: new Date('2025-02-10'),
      summary:
        'Finance governance program covering reconciliation, variance detection, and audit readiness.',
      deliverables:
        'Automated validation suite, exception management workflow, quarterly audit dashboard.',
      dataMetrics: {
        dataSources: 3,
        tables: 12,
        pipelines: 5,
        dashboards: 3,
        models: 0,
        volumeTb: 0.9,
        complexity: DataComplexity.MEDIUM,
        sensitivity: DataSensitivity.REGULATED,
      },
    },
      access: [
        {
          member: 'analyticsEngineer',
          systemName: 'Great Expectations Runner',
          status: AccessStatus.GRANTED,
          fulfilledAt: new Date('2025-02-12'),
          notes: 'Provisioned with finance dataset scope.',
        },
        {
          member: 'qualityLead',
          systemName: 'Governance Portal',
          status: AccessStatus.GRANTED,
          fulfilledAt: new Date('2025-02-18'),
        },
      ],
    },
    {
      base: {
        name: 'Marketing Attribution Dashboard',
        description:
          'Deliver executive visualization of multi-touch marketing attribution across digital channels.',
        stage: Stage.VISUALIZATION,
        status: InitiativeStatus.BLOCKED,
        healthStatus: HealthStatus.CRITICAL,
        riskLevel: RiskLevel.HIGH,
        sowReference: 'SOW-MARKETING-2025-02',
        engagementLead: 'Ava Greene',
        projectManager: members.projectManager.name,
        dataArchitect: members.dataArchitect.name,
        startDate: new Date('2025-01-05'),
        targetDate: new Date('2025-04-30'),
      },
      checklistCompletedStages: stageSequence.slice(0, 5),
    scope: {
      status: SOWStatus.IN_REVIEW,
      projectType: ProjectType.HYBRID,
      pmApproved: false,
      pmApprovedAt: null,
      architectApproved: false,
      architectApprovedAt: null,
      signedOffAt: null,
      summary:
        'Attribution insights for marketing leadership with governance constraints around PII access.',
      deliverables:
        'Curated attribution dataset, executive summary dashboard, privacy compliance documentation.',
      dataMetrics: {
        dataSources: 5,
        tables: 18,
        pipelines: 7,
        dashboards: 4,
        models: 1,
        volumeTb: 2.4,
        complexity: DataComplexity.HIGH,
        sensitivity: DataSensitivity.CONFIDENTIAL,
      },
      aiMetrics: {
        modelType: 'Propensity / Attribution Model',
        useCase: 'Multi-touch attribution weighting for campaign ROI',
        baselineAccuracy: 0.68,
        targetAccuracy: 0.8,
        trainingDataTb: 1.1,
        featureCount: 45,
        trainingIterations: 30,
        deploymentStatus: ModelDeploymentStatus.TRAINING,
        monitoringKpis: 'Holdout uplift, drift rate, response latency',
      },
    },
      access: [
        {
          member: 'analyticsEngineer',
          systemName: 'Visualization Sandbox',
          status: AccessStatus.IN_PROGRESS,
          notes: 'Pending privacy team escalation.',
        },
        {
          member: 'dataEngineer',
          systemName: 'Advertising Data Lake',
          status: AccessStatus.BLOCKED,
          notes: 'Legal hold until privacy review completes.',
        },
      ],
    },
  ] as const;

  for (const entry of initiatives) {
    const created = await prisma.initiative.create({
      data: {
        ...entry.base,
        checklistItems: {
          create: stageSequence.map((stage) => {
            const completed = entry.checklistCompletedStages.includes(stage);
            return {
              stage,
              title: `${stage} exit review`,
              description: `Confirm ${stage.toLowerCase()} stage exit criteria.`,
              completed,
              completedAt: completed ? new Date('2025-03-01') : null,
            };
          }),
        },
        assets:
          entry.base.name === 'Customer 360 Enrichment'
            ? {
                create: [
                  {
                    name: 'crm_customers_clean',
                    type: AssetType.DATASET,
                    ownerTeam: 'Data Engineering',
                    steward: 'Miguel Ortiz',
                    acceptanceCriteria:
                      'Daily snapshot with <0.5% null contacts, aligned to canonical customer ID.',
                  },
                  {
                    name: 'Customer 360 Looker Dashboard',
                    type: AssetType.DASHBOARD,
                    ownerTeam: 'Analytics Engineering',
                    steward: 'Priya Desai',
                    acceptanceCriteria:
                      'Interactive dashboard with daily refresh and stakeholder sign-off.',
                  },
                ],
              }
            : entry.base.name === 'Financial Data Trust Validation'
            ? {
                create: [
                  {
                    name: 'finance_close_validations',
                    type: AssetType.PIPELINE,
                    ownerTeam: 'Governance',
                    steward: 'Alicia Brown',
                    acceptanceCriteria:
                      'Automated validation suite covering reconciliation, variance, and completeness checks.',
                  },
                ],
              }
            : {
                create: [
                  {
                    name: 'marketing_touchpoints_curated',
                    type: AssetType.DATASET,
                    ownerTeam: 'Data Engineering',
                    steward: 'Noah Beck',
                    acceptanceCriteria:
                      'Unified dataset with attributed conversions and spend mapped to paid channels.',
                  },
                  {
                    name: 'Attribution Executive Deck',
                    type: AssetType.REPORT,
                    ownerTeam: 'Analytics',
                    steward: 'Sasha Kim',
                    acceptanceCriteria:
                      'Monthly narrative with KPIs, budget pacing, and scenario modeling ready for CMO review.',
                  },
                ],
              },
        risks:
          entry.base.name === 'Customer 360 Enrichment'
            ? {
                create: [
                  {
                    title: 'Schema drift in support ticket source',
                    description:
                      'Support vendor is rolling out a new API version that could break ingestion.',
                    severity: RiskLevel.MEDIUM,
                    mitigationPlan:
                      'Coordinate with vendor, add contract tests, parallel run for two weeks.',
                    status: RiskStatus.OPEN,
                    owner: 'Dana Waters',
                  },
                ],
              }
            : entry.base.name === 'Financial Data Trust Validation'
            ? {
                create: [
                  {
                    title: 'Peak load may extend validation runtime',
                    description:
                      'Monthly close spikes may cause jobs to exceed SLA during quarter close.',
                    severity: RiskLevel.LOW,
                    status: RiskStatus.MITIGATED,
                    mitigationPlan:
                      'Provision additional compute and stagger job execution windows.',
                    owner: 'Christopher Lane',
                  },
                ],
              }
            : {
                create: [
                  {
                    title: 'Data privacy compliance review pending',
                    description:
                      'Legal team has not signed off on blending ad platform data with CRM contact data.',
                    severity: RiskLevel.HIGH,
                    status: RiskStatus.OPEN,
                    mitigationPlan:
                      'Host review workshop, implement additional anonymization, capture retention policy.',
                    owner: 'Ava Greene',
                  },
                ],
              },
        dependencies:
          entry.base.name === 'Customer 360 Enrichment'
            ? {
                create: [
                  {
                    name: 'Identity resolution service upgrade',
                    type: 'Platform',
                    status: DependencyStatus.BLOCKED,
                    description:
                      'Awaiting new ID graph release to merge CRM + product telemetry.',
                    externalSystem: 'Identity Graph v2',
                    dueDate: new Date('2025-05-15'),
                  },
                ],
              }
            : entry.base.name === 'Financial Data Trust Validation'
            ? {
                create: [
                  {
                    name: 'ERP integration testing',
                    type: 'Application',
                    status: DependencyStatus.OPEN,
                    description:
                      'Need ERP QA environment ready for test automation.',
                    externalSystem: 'Oracle ERP QA',
                    dueDate: new Date('2025-04-15'),
                  },
                ],
              }
            : {
                create: [
                  {
                    name: 'Legal privacy assessment',
                    type: 'Governance',
                    status: DependencyStatus.BLOCKED,
                    description:
                      'Need privacy counsel approval before production deployment.',
                    externalSystem: 'Legal workflow',
                    dueDate: new Date('2025-05-10'),
                  },
                ],
              },
      },
    });

    const currentStageIndex = stageSequence.indexOf(created.stage);
    const historyEntries = stageSequence
      .slice(0, currentStageIndex + 1)
      .map((stage, idx) => ({
        initiativeId: created.id,
        fromStage: idx === 0 ? null : stageSequence[idx - 1],
        toStage: stage,
        actor: 'system_seed',
        reason:
          idx === currentStageIndex
            ? 'Seeded current stage'
            : 'Seeded historical progression',
      }));

    await prisma.stageHistory.createMany({
      data: historyEntries,
    });

    const scope = await prisma.scopeOfWork.create({
      data: {
        initiativeId: created.id,
        summary: entry.scope.summary,
        deliverables: entry.scope.deliverables,
        status: entry.scope.status,
        projectType: entry.scope.projectType,
        pmOwner: members.projectManager.name,
        architectOwner: members.dataArchitect.name,
        pmApproved: entry.scope.pmApproved,
        pmApprovedAt: entry.scope.pmApprovedAt,
        architectApproved: entry.scope.architectApproved,
        architectApprovedAt: entry.scope.architectApprovedAt,
        signedOffAt: entry.scope.signedOffAt,
        lastReviewedAt: new Date('2025-03-10'),
      },
    });

    if (entry.scope.dataMetrics) {
      await prisma.dataScopeMetrics.create({
        data: {
          scopeOfWorkId: scope.id,
          ...entry.scope.dataMetrics,
        },
      });
    }

    if (entry.scope.aiMetrics) {
      await prisma.aiScopeMetrics.create({
        data: {
          scopeOfWorkId: scope.id,
          ...entry.scope.aiMetrics,
        },
      });
    }

    await prisma.initiativeAssignment.createMany({
      data: [
        {
          initiativeId: created.id,
          memberId: members.projectManager.id,
          responsibility: 'Project Management',
        },
        {
          initiativeId: created.id,
          memberId: members.dataArchitect.id,
          responsibility: 'Data Architecture',
        },
        {
          initiativeId: created.id,
          memberId: members.analyticsEngineer.id,
          responsibility: 'Analytics Engineering',
        },
        {
          initiativeId: created.id,
          memberId: members.dataEngineer.id,
          responsibility: 'Ingestion & Pipelines',
        },
        {
          initiativeId: created.id,
          memberId: members.qualityLead.id,
          responsibility: 'Data Quality & Validation',
        },
      ],
    });

    await prisma.accessProvision.createMany({
      data: entry.access.map((access) => ({
        initiativeId: created.id,
        memberId: members[access.member].id,
        systemName: access.systemName,
        status: access.status,
        fulfilledAt: access.fulfilledAt ?? null,
        notes: access.notes ?? null,
      })),
    });

    const approvalRecords = stageSequence.flatMap((stage, index) =>
      approvalRoles.map((role) => {
        const approvedForStage = index < currentStageIndex;
        const approver =
          role === StageApprovalRole.PROJECT_MANAGER
            ? members.projectManager
            : members.dataArchitect;

        return {
          initiativeId: created.id,
          stage,
          role,
          approved: approvedForStage,
          approvedBy: approvedForStage ? approver.name : null,
          approvedAt: approvedForStage ? new Date('2025-02-01') : null,
          notes: approvedForStage ? 'Stage exit conditions satisfied.' : null,
        };
      }),
    );

    await prisma.stageApproval.createMany({
      data: approvalRecords,
    });
  }
}

async function main() {
  await prisma.accessProvision.deleteMany();
  await prisma.initiativeAssignment.deleteMany();
  await prisma.stageApproval.deleteMany();
  await prisma.scopeOfWork.deleteMany();
  await prisma.stageHistory.deleteMany();
  await prisma.stageChecklistItem.deleteMany();
  await prisma.dataAsset.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.teamMember.deleteMany();

  await seedInitiatives();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
