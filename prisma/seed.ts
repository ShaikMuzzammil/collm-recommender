import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CoLLM database...");

  // Demo user
  const hashedPw = await bcrypt.hash("collm2024!", 12);
  const user = await db.user.upsert({
    where: { email: "demo@collm.app" },
    update: {},
    create: {
      name: "Demo Researcher",
      email: "demo@collm.app",
      password: hashedPw,
      organization: "USTC",
      role: "user",
    },
  });
  console.log("✅ Demo user:", user.email);

  // Seed datasets
  const datasets = [
    { name: "MovieLens-1M", slug: "ml-1m", description: "Movie ratings dataset (2000–2003), 1M+ ratings.", trainCount: 33891, validCount: 10401, testCount: 7331, userCount: 839, itemCount: 3256 },
    { name: "Amazon-Book", slug: "amazon-book", description: "Amazon book reviews (1996–2018), 4M+ interactions.", trainCount: 727468, validCount: 25747, testCount: 25747, userCount: 22967, itemCount: 34154 },
    { name: "Video Games", slug: "video-games", description: "Amazon Video Games product reviews.", trainCount: 45000, validCount: 8000, testCount: 8000, userCount: 12000, itemCount: 8000 },
    { name: "CDs & Vinyl", slug: "cds-vinyl", description: "Amazon CDs & Vinyl reviews dataset.", trainCount: 120000, validCount: 20000, testCount: 20000, userCount: 35000, itemCount: 18000 },
  ];

  for (const ds of datasets) {
    await db.dataset.upsert({ where: { slug: ds.slug }, update: {}, create: ds });
  }
  console.log("✅ Datasets seeded:", datasets.length);

  // Seed sample training jobs for demo user
  const jobs = [
    { name: "CoLLM-DIN on ML-1M", dataset: "ml-1m", collabModel: "din", status: "completed", progress: 100, finalAuc: 0.7353, finalUauc: 0.6923, finalNdcg: 0.8735 },
    { name: "CoLLM-MF on Amazon-Book", dataset: "amazon-book", collabModel: "mf", status: "completed", progress: 100, finalAuc: 0.8109, finalUauc: 0.6225, finalNdcg: 0.8457 },
    { name: "CoLLM-LightGCN on ML-1M", dataset: "ml-1m", collabModel: "lightgcn", status: "completed", progress: 100, finalAuc: 0.7100, finalUauc: 0.6967, finalNdcg: 0.8740 },
  ];
  for (const job of jobs) {
    await db.trainingJob.create({ data: { ...job, userId: user.id, llmBackbone: "vicuna-7b", collabDim: 64, loraR: 8, loraAlpha: 16, gpuCount: 2, completedAt: new Date() } });
  }
  console.log("✅ Sample training jobs seeded");

  console.log("\n🎉 Seed complete!\n  Demo login: demo@collm.app / collm2024!");
}

main().catch(console.error).finally(() => db.$disconnect());
