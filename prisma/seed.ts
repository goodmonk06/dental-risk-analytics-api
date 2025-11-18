import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive Phase 3 data...');

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.treatmentPlanItem.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.riskAnalysis.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.clinic.deleteMany();

  console.log('Creating clinics...');
  // ========================================
  // Vertical Slice 1: Clinic Management
  // ========================================
  const clinics = await Promise.all([
    prisma.clinic.create({
      data: {
        name: '東京デンタルクリニック',
        code: 'TDC-001',
        email: 'info@tokyo-dental.jp',
        phone: '03-1234-5678',
        address: '渋谷区恵比寿1-2-3',
        city: '東京',
        state: '東京都',
        zipCode: '150-0013',
        website: 'https://tokyo-dental.jp',
        settings: { operatingHours: '9:00-18:00', closedDays: ['Sunday', 'Holiday'] },
      },
    }),
    prisma.clinic.create({
      data: {
        name: '横浜ファミリー歯科',
        code: 'YFC-001',
        email: 'contact@yokohama-family.jp',
        phone: '045-9876-5432',
        address: 'みなとみらい2-3-4',
        city: '横浜',
        state: '神奈川県',
        zipCode: '220-0012',
        settings: { operatingHours: '10:00-19:00', parkingAvailable: true },
      },
    }),
    prisma.clinic.create({
      data: {
        name: 'さくら歯科医院',
        code: 'SKR-001',
        email: 'info@sakura-dental.jp',
        phone: '042-555-1234',
        address: '中央区桜町5-6-7',
        city: '立川',
        state: '東京都',
        zipCode: '190-0004',
      },
    }),
  ]);
  console.log(`✅ Created ${clinics.length} clinics`);

  console.log('Creating dentists...');
  const dentists = await Promise.all([
    // Tokyo Dental Clinic dentists
    prisma.dentist.create({
      data: {
        clinicId: clinics[0].id,
        firstName: '太郎',
        lastName: '田中',
        email: 'tanaka@tokyo-dental.jp',
        phone: '090-1111-2222',
        licenseNumber: 'DL-123456',
        specialties: ['general', 'prosthodontics'],
        bio: '25年の臨床経験を持つベテラン歯科医師',
        yearsOfExperience: 25,
      },
    }),
    prisma.dentist.create({
      data: {
        clinicId: clinics[0].id,
        firstName: '花子',
        lastName: '佐藤',
        email: 'sato@tokyo-dental.jp',
        phone: '090-3333-4444',
        licenseNumber: 'DL-234567',
        specialties: ['orthodontics'],
        bio: '矯正歯科専門医。アメリカ留学経験あり',
        yearsOfExperience: 12,
      },
    }),
    // Yokohama Family Dental dentists
    prisma.dentist.create({
      data: {
        clinicId: clinics[1].id,
        firstName: '健',
        lastName: '鈴木',
        email: 'suzuki@yokohama-family.jp',
        licenseNumber: 'DL-345678',
        specialties: ['general', 'pediatric'],
        yearsOfExperience: 8,
      },
    }),
    prisma.dentist.create({
      data: {
        clinicId: clinics[1].id,
        firstName: '美咲',
        lastName: '高橋',
        email: 'takahashi@yokohama-family.jp',
        licenseNumber: 'DL-456789',
        specialties: ['periodontics'],
        yearsOfExperience: 15,
      },
    }),
    // Sakura Dental dentists
    prisma.dentist.create({
      data: {
        clinicId: clinics[2].id,
        firstName: '誠',
        lastName: '伊藤',
        email: 'ito@sakura-dental.jp',
        licenseNumber: 'DL-567890',
        specialties: ['general', 'endodontics'],
        yearsOfExperience: 10,
      },
    }),
  ]);
  console.log(`✅ Created ${dentists.length} dentists`);

  console.log('Creating patients...');
  const patients = await Promise.all([
    // Tokyo Dental Clinic patients
    prisma.patient.create({
      data: {
        clinicId: clinics[0].id,
        code: 'P001',
        firstName: '一郎',
        lastName: '山田',
        dateOfBirth: new Date('1988-05-15'),
        age: 35,
        gender: 'male',
        email: 'yamada@example.com',
        phone: '080-1234-5678',
        address: '渋谷区1-2-3',
        city: '東京',
        insuranceProvider: '健康保険組合',
        insuranceId: 'INS-001',
        memo: '定期検診、虫歯治療歴あり',
        tags: ['regular', 'high-risk'],
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinics[0].id,
        code: 'P002',
        firstName: '美咲',
        lastName: '木村',
        dateOfBirth: new Date('1995-08-22'),
        age: 28,
        gender: 'female',
        email: 'kimura@example.com',
        phone: '080-2345-6789',
        address: '目黒区4-5-6',
        city: '東京',
        memo: '矯正治療検討中',
        tags: ['orthodontics'],
      },
    }),
    // Yokohama Family Dental patients
    prisma.patient.create({
      data: {
        clinicId: clinics[1].id,
        code: 'P003',
        firstName: '健太',
        lastName: '中村',
        dateOfBirth: new Date('1981-03-10'),
        age: 42,
        gender: 'male',
        email: 'nakamura@example.com',
        phone: '080-3456-7890',
        insuranceProvider: '協会けんぽ',
        insuranceId: 'INS-002',
        memo: '歯周病治療中',
        tags: ['periodontal'],
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinics[1].id,
        code: 'P004',
        firstName: 'さくら',
        lastName: '小林',
        dateOfBirth: new Date('2004-12-05'),
        age: 19,
        gender: 'female',
        email: 'kobayashi@example.com',
        phone: '080-4567-8901',
        memo: '初診、予防歯科希望',
        tags: ['new', 'preventive'],
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinics[2].id,
        code: 'P005',
        firstName: '隆',
        lastName: '加藤',
        dateOfBirth: new Date('1967-07-20'),
        age: 56,
        gender: 'male',
        email: 'kato@example.com',
        phone: '080-5678-9012',
        insuranceProvider: '国民健康保険',
        memo: 'インプラント治療後のメンテナンス',
        tags: ['implant', 'maintenance'],
      },
    }),
  ]);
  console.log(`✅ Created ${patients.length} patients`);

  console.log('Creating risk analyses...');
  const analyses = [
    await prisma.riskAnalysis.create({ data: { patientId: patients[0].id, type: 'caries', score: 0.72, confidence: 0.89, modelVersion: 'v1.0', inputMeta: { previousCavities: 3 } } }),
    await prisma.riskAnalysis.create({ data: { patientId: patients[1].id, type: 'alignment', score: 0.68, confidence: 0.92, modelVersion: 'v1.0', inputMeta: { overbite: 'moderate' } } }),
    await prisma.riskAnalysis.create({ data: { patientId: patients[2].id, type: 'periodontal', score: 0.81, confidence: 0.87, modelVersion: 'v1.0', inputMeta: { pocketDepth: 5 } } }),
  ];
  console.log(`✅ Created ${analyses.length} risk analyses`);

  console.log('Creating appointments...');
  // Vertical Slice 2: Appointment Scheduling
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = [
    await prisma.appointment.create({ data: { clinicId: clinics[0].id, patientId: patients[0].id, dentistId: dentists[0].id, scheduledAt: tomorrow, duration: 30, type: 'CHECKUP', status: 'CONFIRMED', reason: '定期検診' } }),
    await prisma.appointment.create({ data: { clinicId: clinics[0].id, patientId: patients[1].id, dentistId: dentists[1].id, scheduledAt: nextWeek, duration: 60, type: 'CONSULTATION', status: 'SCHEDULED', reason: '矯正相談' } }),
    await prisma.appointment.create({ data: { clinicId: clinics[1].id, patientId: patients[2].id, dentistId: dentists[3].id, scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), duration: 45, type: 'TREATMENT', status: 'SCHEDULED', reason: '歯周病治療' } }),
  ];
  console.log(`✅ Created ${appointments.length} appointments`);

  console.log('Creating treatment plans...');
  // Vertical Slice 3: Treatment Planning
  const treatmentPlans = [
    await prisma.treatmentPlan.create({
      data: {
        patientId: patients[0].id,
        dentistId: dentists[0].id,
        title: '虫歯治療プラン',
        description: '複数本の虫歯治療を計画的に実施',
        status: 'ACCEPTED',
        priority: 'high',
        estimatedCost: 50000,
        estimatedDuration: 30,
        acceptedAt: new Date(),
        items: {
          create: [
            { title: '上顎第一大臼歯 充填', category: 'restorative', priority: 1, estimatedCost: 15000, analysisId: analyses[0].id },
            { title: '下顎第二小臼歯 充填', category: 'restorative', priority: 2, estimatedCost: 15000 },
            { title: 'フッ素塗布', category: 'preventive', priority: 3, estimatedCost: 5000 },
          ],
        },
      },
    }),
    await prisma.treatmentPlan.create({
      data: {
        patientId: patients[1].id,
        dentistId: dentists[1].id,
        title: '矯正治療プラン',
        description: 'インビザラインによる歯列矯正',
        status: 'PROPOSED',
        priority: 'medium',
        estimatedCost: 800000,
        estimatedDuration: 730,
        proposedAt: new Date(),
        items: {
          create: [
            { title: '初回診断・型取り', category: 'orthodontics', priority: 1, estimatedCost: 50000 },
            { title: 'アライナー装着開始', category: 'orthodontics', priority: 2, estimatedCost: 750000, analysisId: analyses[1].id },
          ],
        },
      },
    }),
  ];
  console.log(`✅ Created ${treatmentPlans.length} treatment plans`);

  console.log('\n📊 Phase 3 Seed Summary:');
  console.log(`   Clinics: ${clinics.length}`);
  console.log(`   Dentists: ${dentists.length}`);
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Risk Analyses: ${analyses.length}`);
  console.log(`   Appointments: ${appointments.length}`);
  console.log(`   Treatment Plans: ${treatmentPlans.length}`);
  console.log('\n✨ Phase 3 seeding completed successfully!');
  console.log('\nVertical Slices Ready:');
  console.log('  1. Clinic Management: 3 clinics with 5 dentists');
  console.log('  2. Appointment Scheduling: 3 upcoming appointments');
  console.log('  3. Treatment Planning: 2 treatment plans with items');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
