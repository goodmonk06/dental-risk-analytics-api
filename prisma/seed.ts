import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 既存のデータをクリア
  await prisma.riskAnalysis.deleteMany();
  await prisma.patient.deleteMany();

  // 患者データの作成
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        code: 'P001',
        age: 35,
        gender: 'male',
        memo: '定期検診、虫歯治療歴あり',
      },
    }),
    prisma.patient.create({
      data: {
        code: 'P002',
        age: 28,
        gender: 'female',
        memo: '矯正治療検討中',
      },
    }),
    prisma.patient.create({
      data: {
        code: 'P003',
        age: 42,
        gender: 'male',
        memo: '歯周病治療中',
      },
    }),
    prisma.patient.create({
      data: {
        code: 'P004',
        age: 19,
        gender: 'female',
        memo: '初診、予防歯科希望',
      },
    }),
    prisma.patient.create({
      data: {
        code: 'P005',
        age: 56,
        gender: 'other',
        memo: 'インプラント治療後のメンテナンス',
      },
    }),
  ]);

  console.log(`✅ Created ${patients.length} patients`);

  // リスク分析データの作成
  const analyses = [];

  // P001の分析履歴
  analyses.push(
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[0].id,
        type: 'caries',
        score: 0.72,
        inputMeta: {
          imageUrl: 'https://example.com/xray/p001-001.jpg',
          data: {
            previousCavities: 3,
            sugarIntake: 'medium',
            brushingFrequency: 2,
          },
        },
      },
    }),
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[0].id,
        type: 'periodontal',
        score: 0.45,
        inputMeta: {
          data: {
            plaque: 'moderate',
            bleeding: false,
          },
        },
      },
    })
  );

  // P002の分析履歴
  analyses.push(
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[1].id,
        type: 'alignment',
        score: 0.68,
        inputMeta: {
          imageUrl: 'https://example.com/photo/p002-front.jpg',
          data: {
            overbite: 'moderate',
            crowding: 'mild',
          },
        },
      },
    }),
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[1].id,
        type: 'caries',
        score: 0.23,
        inputMeta: {
          data: {
            previousCavities: 0,
            sugarIntake: 'low',
            brushingFrequency: 3,
          },
        },
      },
    })
  );

  // P003の分析履歴
  analyses.push(
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[2].id,
        type: 'periodontal',
        score: 0.81,
        inputMeta: {
          imageUrl: 'https://example.com/xray/p003-periodontal.jpg',
          data: {
            plaque: 'heavy',
            bleeding: true,
            pocketDepth: 5,
          },
        },
      },
    }),
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[2].id,
        type: 'caries',
        score: 0.58,
        inputMeta: {
          data: {
            previousCavities: 5,
            sugarIntake: 'high',
            brushingFrequency: 1,
          },
        },
      },
    })
  );

  // P004の分析履歴
  analyses.push(
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[3].id,
        type: 'caries',
        score: 0.15,
        inputMeta: {
          imageUrl: 'https://example.com/xray/p004-001.jpg',
          data: {
            previousCavities: 0,
            sugarIntake: 'low',
            brushingFrequency: 3,
            flossing: true,
          },
        },
      },
    })
  );

  // P005の分析履歴
  analyses.push(
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[4].id,
        type: 'occlusion',
        score: 0.42,
        inputMeta: {
          imageUrl: 'https://example.com/scan/p005-3d.jpg',
          data: {
            implants: 2,
            biteBalance: 'good',
          },
        },
      },
    }),
    await prisma.riskAnalysis.create({
      data: {
        patientId: patients[4].id,
        type: 'periodontal',
        score: 0.36,
        inputMeta: {
          data: {
            plaque: 'light',
            bleeding: false,
            maintenance: true,
          },
        },
      },
    })
  );

  console.log(`✅ Created ${analyses.length} risk analyses`);

  console.log('\n📊 Seed Summary:');
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Risk Analyses: ${analyses.length}`);
  console.log('\n✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
