import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const email = "demo@jobhunt.dev";
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Jordan Rivera", passwordHash },
  });

  console.log(`Seed user: ${email} / password123`);

  // Clear existing demo data for idempotent re-seeding.
  await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
  await prisma.followup.deleteMany({ where: { userId: user.id } });
  await prisma.interview.deleteMany({ where: { userId: user.id } });
  await prisma.applicationContact.deleteMany({ where: { application: { userId: user.id } } });
  await prisma.contact.deleteMany({ where: { userId: user.id } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.applicationResume.deleteMany({ where: { application: { userId: user.id } } });
  await prisma.application.deleteMany({ where: { userId: user.id } });
  await prisma.resume.deleteMany({ where: { userId: user.id } });
  await prisma.jobImport.deleteMany({ where: { userId: user.id } });

  // ---- Resumes ----
  const swResume = await prisma.resume.create({
    data: {
      userId: user.id,
      name: "Software Engineer — Base",
      fileType: "txt",
      isBaseResume: true,
      version: 1,
      tags: "software,backend,general",
      extractedText:
        "Jordan Rivera\nSoftware Engineer\n\nEXPERIENCE\nSoftware Engineering Intern — Acme Corp (Summer 2025)\n- Built REST APIs in Python/Django serving 10k+ daily requests\n- Reduced query latency 35% by adding database indexes\n\nPROJECTS\nJobHunt Tracker — personal project\n- Next.js + PostgreSQL app for tracking job applications\n\nSKILLS\nPython, TypeScript, React, SQL, AWS, Docker",
    },
  });

  const swResumeV2 = await prisma.resume.create({
    data: {
      userId: user.id,
      name: "Software Engineer — Base (tailored for Stripe)",
      fileType: "txt",
      isBaseResume: false,
      version: 2,
      parentResumeId: swResume.id,
      tags: "software,backend,stripe",
      extractedText:
        swResume.extractedText +
        "\n\n(Tailored: emphasized payments-adjacent API work and reliability metrics for Stripe application.)",
    },
  });

  const dsResume = await prisma.resume.create({
    data: {
      userId: user.id,
      name: "Data Science — Base",
      fileType: "txt",
      isBaseResume: true,
      version: 1,
      tags: "data science,ml,analytics",
      extractedText:
        "Jordan Rivera\nData Scientist\n\nEXPERIENCE\nData Analyst Intern — Beacon Health (Summer 2025)\n- Built churn prediction model (AUC 0.83) using scikit-learn\n- Automated weekly reporting pipeline in Python, saving 6 hrs/week\n\nEDUCATION\nB.S. Computer Science, Stony Brook University\n\nSKILLS\nPython, SQL, pandas, scikit-learn, PyTorch, Tableau",
    },
  });

  // ---- Applications ----
  const stripe = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Stripe",
      jobTitle: "Software Engineer, New Grad",
      jobURL: "https://stripe.com/jobs/listing/software-engineer-new-grad",
      location: "San Francisco, CA",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      salaryMin: 150000,
      salaryMax: 190000,
      salaryCurrency: "USD",
      jobDescription:
        "Stripe is looking for a New Grad Software Engineer to join our Payments Infrastructure team. You'll build and scale systems that process billions of dollars in transactions.",
      requirements: "BS in Computer Science or related field\nStrong fundamentals in data structures and algorithms\nExperience with at least one backend language",
      preferredQualifications: "Experience with distributed systems\nContributions to open source",
      skills: "Python, Go, Distributed Systems, SQL, Kubernetes",
      roleCategory: "Software Engineer",
      source: "GREENHOUSE",
      applicationStatus: "TECHNICAL_INTERVIEW",
      dateFound: daysAgo(35),
      dateApplied: daysAgo(30),
      createdAt: daysAgo(35),
    },
  });

  const capitalOne = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Capital One",
      jobTitle: "Data Scientist",
      jobURL: "https://www.capitalonecareers.com/job/data-scientist",
      location: "McLean, VA",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      salaryMin: 120000,
      salaryMax: 145000,
      salaryCurrency: "USD",
      jobDescription:
        "Join Capital One's Card division as a Data Scientist building models to detect fraud and assess credit risk at scale.",
      requirements: "MS or BS in a quantitative field\nProficiency in Python and SQL\nExperience with machine learning models",
      preferredQualifications: "Experience in financial services\nFamiliarity with AWS SageMaker",
      skills: "Python, SQL, scikit-learn, AWS, Risk Modeling",
      roleCategory: "Data Scientist",
      source: "COMPANY_SITE",
      applicationStatus: "RECRUITER_SCREEN",
      dateFound: daysAgo(20),
      dateApplied: daysAgo(18),
      createdAt: daysAgo(20),
    },
  });

  const datadog = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Datadog",
      jobTitle: "Machine Learning Engineer",
      jobURL: "https://careers.datadoghq.com/detail/machine-learning-engineer",
      location: "New York, NY",
      workMode: "REMOTE",
      employmentType: "FULL_TIME",
      salaryMin: 140000,
      salaryMax: 175000,
      salaryCurrency: "USD",
      jobDescription:
        "Datadog is hiring a Machine Learning Engineer to work on anomaly detection systems used by thousands of customers to monitor their infrastructure.",
      requirements: "Experience building and deploying ML models in production\nStrong software engineering fundamentals",
      preferredQualifications: "Experience with time-series anomaly detection\nExperience with large-scale data pipelines",
      skills: "Python, PyTorch, Time Series, Kafka, AWS",
      roleCategory: "Machine Learning Engineer",
      source: "LEVER",
      applicationStatus: "OFFER",
      dateFound: daysAgo(50),
      dateApplied: daysAgo(45),
      createdAt: daysAgo(50),
    },
  });

  const moffitt = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Moffitt Cancer Center",
      jobTitle: "AI Administrative Resident",
      jobURL: "https://moffitt.org/careers/ai-administrative-resident",
      location: "Tampa, FL",
      workMode: "ONSITE",
      employmentType: "FULL_TIME",
      salaryMin: 65000,
      salaryMax: 75000,
      salaryCurrency: "USD",
      jobDescription:
        "The AI Administrative Resident will support Moffitt's initiative to apply AI and data science to clinical operations and administrative workflows.",
      requirements: "Master's degree in health administration, data science, or related field",
      preferredQualifications: "Experience with healthcare data\nStrong communication skills",
      skills: "SQL, Python, Healthcare Analytics, Project Management",
      roleCategory: "AI / Healthcare Administration",
      source: "COMPANY_SITE",
      applicationStatus: "REJECTED",
      dateFound: daysAgo(60),
      dateApplied: daysAgo(55),
      createdAt: daysAgo(60),
    },
  });

  const notion = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Notion",
      jobTitle: "Backend Engineer",
      location: "Remote (US)",
      workMode: "REMOTE",
      employmentType: "FULL_TIME",
      salaryCurrency: "USD",
      roleCategory: "Software Engineer",
      source: "LINKEDIN",
      applicationStatus: "SAVED",
      dateFound: daysAgo(3),
      createdAt: daysAgo(3),
    },
  });

  const anthropic = await prisma.application.create({
    data: {
      userId: user.id,
      company: "Anthropic",
      jobTitle: "Applied AI Engineer",
      location: "San Francisco, CA",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      roleCategory: "Software Engineer",
      source: "COMPANY_SITE",
      applicationStatus: "PREPARING",
      dateFound: daysAgo(6),
      createdAt: daysAgo(6),
    },
  });

  // ---- Resume ↔ Application links ----
  await prisma.applicationResume.create({
    data: { applicationId: stripe.id, resumeId: swResumeV2.id, submittedAt: daysAgo(30) },
  });
  await prisma.applicationResume.create({
    data: { applicationId: capitalOne.id, resumeId: dsResume.id, submittedAt: daysAgo(18) },
  });
  await prisma.applicationResume.create({
    data: { applicationId: datadog.id, resumeId: swResume.id, submittedAt: daysAgo(45) },
  });
  await prisma.applicationResume.create({
    data: { applicationId: moffitt.id, resumeId: dsResume.id, submittedAt: daysAgo(55) },
  });

  // ---- Notes ----
  await prisma.note.createMany({
    data: [
      { userId: user.id, applicationId: stripe.id, content: "Found an SBU alumnus working on the ML infra team — reaching out on LinkedIn.", category: "RESEARCH", pinned: true, createdAt: daysAgo(28) },
      { userId: user.id, applicationId: stripe.id, content: "Recruiter said hiring manager review takes approximately one week.", category: "RECRUITER", createdAt: daysAgo(25) },
      { userId: user.id, applicationId: stripe.id, content: "Technical interview scheduled for next Tuesday — focus on systems design and Go.", category: "INTERVIEW", createdAt: daysAgo(5) },
      { userId: user.id, applicationId: capitalOne.id, content: "Messaged recruiter on LinkedIn, no response yet.", category: "RECRUITER", createdAt: daysAgo(10) },
      { userId: user.id, applicationId: datadog.id, content: "Referral requested from John (works on the APM team).", category: "REFERRAL", pinned: true, createdAt: daysAgo(44) },
      { userId: user.id, applicationId: datadog.id, content: "Offer came in — need to negotiate start date and comp before accepting.", category: "GENERAL", createdAt: daysAgo(2) },
      { userId: user.id, applicationId: moffitt.id, content: "Rejected after final round — asked for feedback, none given.", category: "GENERAL", createdAt: daysAgo(40) },
    ],
  });

  // ---- Contacts ----
  const johnContact = await prisma.contact.create({
    data: {
      userId: user.id,
      name: "John Alvarez",
      company: "Datadog",
      jobTitle: "Senior Software Engineer",
      contactType: "REFERRAL",
      email: "john.alvarez@example.com",
      linkedinURL: "https://linkedin.com/in/example-john",
      relationship: "Former coworker",
      lastContactedAt: daysAgo(44),
      createdAt: daysAgo(44),
    },
  });
  await prisma.applicationContact.create({ data: { applicationId: datadog.id, contactId: johnContact.id } });

  const stripeRecruiter = await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Priya Nair",
      company: "Stripe",
      jobTitle: "University Recruiter",
      contactType: "RECRUITER",
      email: "priya.recruiting@example.com",
      lastContactedAt: daysAgo(25),
      followUpDate: daysAgo(-2),
      createdAt: daysAgo(30),
    },
  });
  await prisma.applicationContact.create({ data: { applicationId: stripe.id, contactId: stripeRecruiter.id } });

  const alumniContact = await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Wei Zhang",
      company: "Capital One",
      jobTitle: "Data Scientist II",
      contactType: "ALUMNI",
      relationship: "Stony Brook alumnus",
      createdAt: daysAgo(15),
    },
  });
  await prisma.applicationContact.create({ data: { applicationId: capitalOne.id, contactId: alumniContact.id } });

  // ---- Interviews ----
  await prisma.interview.create({
    data: {
      userId: user.id,
      applicationId: stripe.id,
      stage: "RECRUITER_SCREEN",
      scheduledAt: daysAgo(25),
      interviewer: "Priya Nair",
      notes: "Went well — discussed background and interest in payments infrastructure.",
      result: "PASSED",
    },
  });
  await prisma.interview.create({
    data: {
      userId: user.id,
      applicationId: stripe.id,
      stage: "TECHNICAL_SCREEN",
      scheduledAt: daysAgo(-2),
      interviewer: "TBD",
      meetingURL: "https://meet.google.com/example",
      questionsAsked: "Design a rate limiter for a payments API.",
      followUpRequired: true,
      result: "PENDING",
    },
  });
  await prisma.interview.create({
    data: {
      userId: user.id,
      applicationId: datadog.id,
      stage: "ONSITE",
      scheduledAt: daysAgo(10),
      notes: "Full loop: system design, ML case study, and behavioral. Felt strong overall.",
      result: "PASSED",
    },
  });
  await prisma.interview.create({
    data: {
      userId: user.id,
      applicationId: moffitt.id,
      stage: "HIRING_MANAGER",
      scheduledAt: daysAgo(42),
      result: "FAILED",
      notes: "They went with a candidate with more healthcare-specific experience.",
    },
  });

  // ---- Follow-ups ----
  await prisma.followup.createMany({
    data: [
      { userId: user.id, applicationId: stripe.id, title: "Follow up with Priya on interview scheduling", dueDate: daysAgo(-1) },
      { userId: user.id, applicationId: capitalOne.id, title: "Check in with recruiter if no response by Friday", dueDate: daysAgo(-4) },
      { userId: user.id, contactId: johnContact.id, title: "Send John a thank-you note for the referral", dueDate: daysAgo(1), completed: true, completedAt: daysAgo(1) },
    ],
  });

  // ---- Activity events ----
  await prisma.activityEvent.createMany({
    data: [
      { userId: user.id, applicationId: stripe.id, type: "JOB_SAVED", description: "Saved Software Engineer, New Grad — Stripe", createdAt: daysAgo(35) },
      { userId: user.id, applicationId: stripe.id, type: "RESUME_SUBMITTED", description: "Software Engineer — Base (tailored for Stripe) v2 attached to Software Engineer, New Grad — Stripe", createdAt: daysAgo(30) },
      { userId: user.id, applicationId: stripe.id, type: "STATUS_CHANGED", description: "Software Engineer, New Grad — Stripe moved to Technical Interview", createdAt: daysAgo(5) },
      { userId: user.id, applicationId: datadog.id, type: "REFERRAL_REQUESTED", description: "Added John Alvarez as a referral", createdAt: daysAgo(44) },
      { userId: user.id, applicationId: datadog.id, type: "INTERVIEW_SCHEDULED", description: "Onsite scheduled for Machine Learning Engineer — Datadog", createdAt: daysAgo(10) },
      { userId: user.id, applicationId: datadog.id, type: "OFFER_RECEIVED", description: "Machine Learning Engineer — Datadog moved to Offer", createdAt: daysAgo(2) },
      { userId: user.id, applicationId: capitalOne.id, type: "JOB_SAVED", description: "Saved Data Scientist — Capital One", createdAt: daysAgo(20) },
      { userId: user.id, applicationId: moffitt.id, type: "STATUS_CHANGED", description: "AI Administrative Resident — Moffitt Cancer Center moved to Rejected", createdAt: daysAgo(40) },
      { userId: user.id, applicationId: notion.id, type: "JOB_SAVED", description: "Saved Backend Engineer — Notion", createdAt: daysAgo(3) },
      { userId: user.id, applicationId: anthropic.id, type: "JOB_SAVED", description: "Saved Applied AI Engineer — Anthropic", createdAt: daysAgo(6) },
    ],
  });

  console.log("Seed complete:");
  console.log(`  ${await prisma.application.count({ where: { userId: user.id } })} applications`);
  console.log(`  ${await prisma.resume.count({ where: { userId: user.id } })} resumes`);
  console.log(`  ${await prisma.contact.count({ where: { userId: user.id } })} contacts`);
  console.log(`  ${await prisma.interview.count({ where: { userId: user.id } })} interviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
