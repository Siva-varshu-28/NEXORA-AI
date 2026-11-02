
const Document = require("../models/Document");
const extractPdfText = require("../services/pdfService");

const normalizeText = (text) => {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeHeading = (line) => {
  return line
    .replace(/^[\s#*•\-]+|[\s:：#*]+$/g, "")
    .trim()
    .toLowerCase();
};

const getSection = (text, startHeading, endHeadings = []) => {
  const lines = text.split("\n");
  const start = startHeading.toLowerCase();

  const startIndex = lines.findIndex(
    (line) => normalizeHeading(line) === start
  );

  if (startIndex === -1) {
    console.log(`Section heading not found: ${startHeading}`);
    return "";
  }

  const endSet = new Set(endHeadings.map((item) => item.toLowerCase()));
  let endIndex = lines.length;

  for (let i = startIndex + 1; i < lines.length; i++) {
    if (endSet.has(normalizeHeading(lines[i]))) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join("\n").trim();
};

const hasTerm = (text, terms) => {
  const normalized = text.toLowerCase();

  return terms.some((term) => {
    const escaped = escapeRegex(term.toLowerCase());
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i");
    return regex.test(normalized);
  });
};

const countProjectActivities = (text) => {
  return text
    .split("\n")
    .filter((line) => {
      const cleaned = line.trim();
      return (
        cleaned.length > 35 &&
        /developed|created|built|implemented|designed|integrated|managed|automated|used|worked|developing|implemented/i.test(
          cleaned
        )
      );
    }).length;
};

const analyzeResume = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      uploadedBy: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Resume document not found",
      });
    }

    const extractedText = await extractPdfText(document.filePath);
    const text = normalizeText(extractedText);

    const projectText = getSection(text, "Projects", [
      "Certificates",
      "Certifications",
      "Achievements",
      "Declaration",
      "Education",
      "Skills",
      "Technical Skills",
      "Professional Experience",
      "Work Experience",
      "Internship",
      "Personal Details",
      "Languages",
      "References",
    ]);

    // Debug: inspect the exact project text extracted from the PDF
    console.log("\n========== EXTRACTED PROJECT TEXT ==========");
    console.log(projectText || "No Projects section detected");
    console.log("============================================\n");

    const technologies = {
      javascript: ["javascript", "java script"],
      react: ["react", "react.js", "reactjs"],
      html: ["html", "html5"],
      css: ["css", "css3"],
      "node.js": ["node.js", "nodejs", "node js"],
      "express.js": ["express.js", "expressjs", "express js"],
      mongodb: ["mongodb", "mongo db"],
      git: ["git", "github"],
    };

    const matchedTechnologies = Object.entries(technologies)
      .filter(([, terms]) => hasTerm(projectText, terms))
      .map(([technology]) => technology);

    const reactDetected = hasTerm(projectText, technologies.react);
    const nodeDetected = hasTerm(projectText, technologies["node.js"]);
    const expressDetected = hasTerm(projectText, technologies["express.js"]);
    const mongoDetected = hasTerm(projectText, technologies.mongodb);

    const projectActivityCount = countProjectActivities(projectText);

    const skills = [
      "javascript",
      "react",
      "node.js",
      "express.js",
      "mongodb",
      "html",
      "css",
      "git",
    ];

    const verifiedSkills = skills.filter((skill) =>
      hasTerm(text, technologies[skill])
    );

    const educationFound = /b\.?sc|bachelor|computer science/i.test(text);
    const mernTrainingFound = /mern|full.?stack development/i.test(text);

    const summaryFound = /professional summary|summary|career objective/i.test(text);
    const educationSectionFound = /education/i.test(text);
    const skillsSectionFound = /technical skills|skills/i.test(text);
    const projectsSectionFound = /projects/i.test(text);
    const experienceFound = /professional experience|work experience|internship|experience/i.test(text);

    const technicalScore = verifiedSkills.length >= 5 ? 3 : verifiedSkills.length >= 3 ? 2 : 1;

    const projectScore =
      projectActivityCount > 0 &&
      reactDetected &&
      nodeDetected &&
      expressDetected &&
      mongoDetected
        ? 3
        : projectActivityCount > 0 && matchedTechnologies.length >= 3
        ? 2
        : 1;

    const educationScore = educationFound && mernTrainingFound ? 2 : educationFound || mernTrainingFound ? 1 : 0;

    const presentationSections = [
      summaryFound,
      educationSectionFound,
      skillsSectionFound,
      projectsSectionFound,
      experienceFound,
    ];

    const presentationScore = presentationSections.filter(Boolean).length >= 4 ? 2 : 1;

    const totalScore = technicalScore + projectScore + educationScore + presentationScore;
    const finalScore = Math.round((totalScore / 10) * 100);

    console.log("\n========== RESUME PROJECT DEBUG ==========");
    console.log("Project text length:", projectText.length);
    console.log("React detected:", reactDetected);
    console.log("Node.js detected:", nodeDetected);
    console.log("Express.js detected:", expressDetected);
    console.log("MongoDB detected:", mongoDetected);
    console.log("Matched project technologies:", matchedTechnologies);
    console.log("Project activity count:", projectActivityCount);
    console.log("Project score:", projectScore);
    console.log("==========================================\n");

    const scoreBreakdown = {
      technicalSkills: {
        score: technicalScore,
        maximum: 3,
        reason: `${verifiedSkills.length} out of 8 checked MERN-related skills were found in the resume.`,
        evidence: `Found skills: ${verifiedSkills.join(", ") || "None"}.`,
        improvement: "Add practical examples showing how you used these technologies in projects.",
      },
      projectRelevance: {
        score: projectScore,
        maximum: 3,
        reason: `${projectActivityCount} project activity statements and ${matchedTechnologies.length} matching web technologies were found in the Projects section.`,
        evidence: `Project technologies found: ${matchedTechnologies.join(", ") || "None"}.`,
        improvement: "Document your frontend, backend, API and database integration with clear project descriptions.",
      },
      educationTraining: {
        score: educationScore,
        maximum: 2,
        reason: "Education and training scores are based on the presence of computer science education and MERN training.",
        evidence: `Computer Science degree: ${educationFound ? "Found" : "Not found"}. MERN training: ${mernTrainingFound ? "Found" : "Not found"}.`,
        improvement: "Add course details and practical work completed during your training.",
      },
      resumePresentation: {
        score: presentationScore,
        maximum: 2,
        reason: `${presentationSections.filter(Boolean).length} out of 5 expected resume sections were found.`,
        evidence: `Sections found: ${[
          summaryFound && "summary",
          educationSectionFound && "education",
          skillsSectionFound && "skills",
          projectsSectionFound && "projects",
          experienceFound && "professional experience",
        ].filter(Boolean).join(", ")}.`,
        improvement: "Use clear headings, concise project descriptions, measurable outcomes and working portfolio links.",
      },
    };

    const strengths = [];

    if (educationFound) strengths.push("Computer Science education is listed.");
    if (mernTrainingFound) strengths.push("MERN training is listed.");
    if (verifiedSkills.length >= 5) {
      strengths.push(`${verifiedSkills.length} relevant technical skills were found.`);
    }

    const areasForImprovement = [];

    if (!(reactDetected && nodeDetected && expressDetected && mongoDetected)) {
      areasForImprovement.push(
        "Show a complete MERN application with frontend, backend and database integration."
      );
    }

    const recommendedSkills = [
      "REST API development",
      "JWT authentication",
      "MERN application deployment",
    ];

    const actionPlan = [
      "Add project screenshots and GitHub repository links.",
      "Document the features and technologies used in each project.",
      "Explain frontend, backend and database integration in full-stack projects.",
    ];

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      score: finalScore,
      scoreBreakdown,
      verifiedSkills,
      strengths,
      areasForImprovement,
      recommendedSkills,
      actionPlan,
      projectFeedback: {
        activityCount: projectActivityCount,
        technologies: matchedTechnologies,
      },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Resume analysis failed",
    });
  }
};

module.exports = { analyzeResume };
