/**
 * Seed — auth (Sprint 2.1) + A1 vocabulary (Sprint 4.1).
 *
 * Seeds:
 *   - permissions / roles / role_permissions (RBAC)
 *   - CEFR level A1 + the A1 vocabulary corpus (real learnable content)
 *
 * Idempotent: safe to run repeatedly. Vocabulary children are replaced per word so
 * re-running never duplicates meanings/examples/pronunciations.
 *
 * Run: `npm run prisma:seed` (requires DATABASE_URL to point at a real database).
 */
import { PrismaClient, type Prisma } from '@prisma/client';

import { PERMISSION_DEFS, ROLE_DEFS } from '../src/lib/auth/permissions';
import { PROMPT_TEMPLATE_REGISTRY } from '../src/modules/ai/config/prompt-templates';
import { A1_VOCABULARY } from './data/a1-vocabulary';
import { loadMissions, loadTracks } from './data/mission-library';

const prisma = new PrismaClient();

async function seedVocabulary() {
  const a1 = await prisma.cefrLevel.upsert({
    where: { code: 'A1' },
    update: { rank: 1, description: 'Beginner' },
    create: { code: 'A1', rank: 1, description: 'Beginner' },
  });

  let index = 0;
  for (const entry of A1_VOCABULARY) {
    index += 1;
    const slug = entry.word.toLowerCase();
    const vocab = await prisma.vocabulary.upsert({
      where: { slug },
      update: { word: entry.word, cefrLevelId: a1.id, frequencyRank: index },
      create: {
        word: entry.word,
        slug,
        cefrLevelId: a1.id,
        frequencyRank: index,
        status: 'published',
      },
    });

    // Replace children to stay idempotent.
    await prisma.vocabularyMeaning.deleteMany({
      where: { vocabularyId: vocab.id },
    });
    await prisma.vocabularyExample.deleteMany({
      where: { vocabularyId: vocab.id },
    });
    await prisma.vocabularyPronunciation.deleteMany({
      where: { vocabularyId: vocab.id },
    });

    await prisma.vocabularyMeaning.create({
      data: {
        vocabularyId: vocab.id,
        partOfSpeech: entry.pos,
        definition: entry.definition,
        translation: entry.vi,
        sortOrder: 0,
      },
    });
    await prisma.vocabularyExample.create({
      data: { vocabularyId: vocab.id, text: entry.example, sortOrder: 0 },
    });
    await prisma.vocabularyPronunciation.create({
      data: {
        vocabularyId: vocab.id,
        ipa: entry.ipa,
        accent: 'us',
        isPrimary: true,
      },
    });
  }
  console.warn(`Seeded ${A1_VOCABULARY.length} A1 vocabulary words.`);
}

async function seedMissionLibrary() {
  const tracks = loadTracks();
  for (const track of tracks) {
    await prisma.contentTrack.upsert({
      where: { key: track.key },
      update: {
        trackId: track.id,
        title: track.title,
        goal: track.goal,
        cefr: track.cefr,
        data: track,
      },
      create: {
        key: track.key,
        trackId: track.id,
        title: track.title,
        goal: track.goal,
        cefr: track.cefr,
        data: track,
      },
    });

    const missions = loadMissions(track.key);
    for (const mission of missions) {
      await prisma.contentMission.upsert({
        where: { id: mission.id },
        update: {
          trackKey: mission.trackId,
          order: mission.order,
          title: mission.title,
          difficulty: mission.difficulty,
          estimatedMinutes: mission.estimatedMinutes,
          data: mission,
        },
        create: {
          id: mission.id,
          trackKey: mission.trackId,
          order: mission.order,
          title: mission.title,
          difficulty: mission.difficulty,
          estimatedMinutes: mission.estimatedMinutes,
          data: mission,
        },
      });
    }
    console.warn(
      `Seeded track "${track.key}" with ${missions.length} missions.`,
    );
  }
}

async function seedPromptTemplates() {
  for (const { template, versions } of PROMPT_TEMPLATE_REGISTRY) {
    await prisma.promptTemplate.upsert({
      where: { id: template.id },
      update: {
        key: template.key,
        name: template.name,
        description: template.description,
        category: template.category,
        variables: template.variables as unknown as Prisma.InputJsonValue,
        activeVersion: template.activeVersion,
      },
      create: {
        id: template.id,
        key: template.key,
        name: template.name,
        description: template.description,
        category: template.category,
        variables: template.variables as unknown as Prisma.InputJsonValue,
        activeVersion: template.activeVersion,
      },
    });

    for (const v of versions) {
      await prisma.promptVersion.upsert({
        where: { id: v.id },
        update: {
          templateId: v.templateId,
          version: v.version,
          body: v.body,
          model: v.model,
          maxOutputTokens: v.maxOutputTokens,
          status: v.status,
          notes: v.notes ?? null,
          createdAt: new Date(v.createdAt),
        },
        create: {
          id: v.id,
          templateId: v.templateId,
          version: v.version,
          body: v.body,
          model: v.model,
          maxOutputTokens: v.maxOutputTokens,
          status: v.status,
          notes: v.notes ?? null,
          createdAt: new Date(v.createdAt),
        },
      });
    }
  }
  console.warn(
    `Seeded ${PROMPT_TEMPLATE_REGISTRY.length} prompt templates (+versions).`,
  );
}

async function main() {
  // 1) Permissions
  for (const def of PERMISSION_DEFS) {
    await prisma.permission.upsert({
      where: { code: def.code },
      update: {
        resource: def.resource,
        action: def.action,
        description: def.description,
      },
      create: {
        code: def.code,
        resource: def.resource,
        action: def.action,
        description: def.description,
      },
    });
  }
  console.warn(`Seeded ${PERMISSION_DEFS.length} permissions.`);

  // 2) Roles + role_permissions
  for (const role of ROLE_DEFS) {
    const roleRow = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });

    const permissionRows = await prisma.permission.findMany({
      where: { code: { in: role.permissions } },
      select: { id: true },
    });

    for (const perm of permissionRows) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: roleRow.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: roleRow.id, permissionId: perm.id },
      });
    }
    console.warn(
      `Seeded role "${role.code}" with ${permissionRows.length} permissions.`,
    );
  }

  // 3) Vocabulary corpus (A1)
  await seedVocabulary();

  // 4) Mission Library (Task 04) — tracks + missions into the DB (RC-03/ADR-0005)
  await seedMissionLibrary();

  // 5) Prompt templates (AI) — seed from the code registry (RC-03/ADR-0005)
  await seedPromptTemplates();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
