/**
 * One-time migration: patches existing Firestore documents for
 * jobs, scholarships, blog posts, and salary_data entries.
 *
 * Run ONCE from your project root:
 *   node scripts/fix-content-status.mjs
 *
 * Requirements:
 *   npm install firebase-admin dotenv
 *   Get service account JSON:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!getApps().length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
  }
}

const db = getFirestore();

async function patchCollection({ collectionName, label, check, patch }) {
  console.log(`\n🔍 Scanning "${collectionName}" — ${label}...`);

  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`   ⚠️  Collection "${collectionName}" is empty or does not exist.`);
    return 0;
  }

  const total = snapshot.size;
  let patched = 0;
  let skipped = 0;
  const BATCH_LIMIT = 400;
  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (check(data)) {
      batch.update(docSnap.ref, { ...patch, updatedAt: new Date() });
      patched++;
      batchCount++;
      console.log(`   ✅ Patching: "${data.title || data.role || data.name || docSnap.id}"`);

      if (batchCount >= BATCH_LIMIT) {
        await batch.commit();
        console.log(`   💾 Committed batch of ${batchCount}`);
        batch = db.batch();
        batchCount = 0;
      }
    } else {
      skipped++;
    }
  }

  if (batchCount > 0) await batch.commit();

  console.log(`   📊 Total: ${total} | Patched: ${patched} | Already OK: ${skipped}`);
  return patched;
}

async function runMigration() {
  console.log('🚀 JoblifyHQ — Content Status Migration');
  console.log('='.repeat(50));

  // ── Jobs: add status:'active' where missing ──────────────────────────────
  await patchCollection({
    collectionName: 'jobs',
    label: 'adding status:active where missing',
    check: (data) => !data.status,
    patch: { status: 'active' },
  });

  // ── Scholarships: add status:'active' where missing ──────────────────────
  await patchCollection({
    collectionName: 'scholarships',
    label: 'adding status:active where missing',
    check: (data) => !data.status,
    patch: { status: 'active' },
  });

  // ── Blog: add published:true where missing ────────────────────────────────
  await patchCollection({
    collectionName: 'blog',
    label: 'adding published:true where missing',
    check: (data) => data.published === undefined || data.published === null,
    patch: { published: true },
  });

  // ── Salary Data: add status:'active' + ensure createdAt exists ───────────
  await patchCollection({
    collectionName: 'salary_data',
    label: 'adding status:active and createdAt where missing',
    check: (data) => !data.status || !data.createdAt,
    patch: { status: 'active', createdAt: new Date() },
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ All migrations complete!\n');
  console.log('Next steps:');
  console.log('  1. Refresh your site — all content should now appear.');
  console.log('  2. Delete this script file — it only needs to run once.');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
