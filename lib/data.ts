/**
 * Static site content only.
 * Public portfolio projects are NOT stored here.
 * Projects are managed from /admin and read from Supabase via lib/website-projects.ts.
 */

export const services = [
  ["01", "Architecture", "Site-responsive planning, spatial design, elevations, working drawings and design development."],
  ["02", "Civil Engineering", "Technical coordination, site planning and practical civil engineering consultancy."],
  ["03", "Structural Design", "Safe, efficient and buildable structural systems coordinated with the architecture."],
  ["04", "Interior Design", "Material, lighting, furniture and spatial detailing for coherent interior environments."],
  ["05", "3D Visualisation", "Clear visual communication through realistic architectural exterior and interior imagery."],
  ["06", "Approvals & Documentation", "Permit drawings, authority submission sets and construction-ready documentation."],
  ["07", "Estimation & Cost Planning", "Quantity planning, cost visibility and decisions aligned with the client budget."],
  ["08", "Construction & Supervision", "Site execution, coordination, inspection, quality control and progress supervision."],
  ["09", "Turnkey Delivery", "One coordinated team from first discussion through final handover."],
] as const;

export const processSteps = [
  ["01", "Understand", "We begin with your land, requirements, lifestyle, priorities and budget."],
  ["02", "Study", "We read the site: access, climate, orientation, context and development possibilities."],
  ["03", "Design", "Architectural concepts turn site conditions, requirements and opportunities into a clear spatial direction."],
  ["04", "Visualise", "Plans, elevations and 3D views help everyone understand the project before execution."],
  ["05", "Engineer", "Structure and civil systems are coordinated to make the design safe and buildable."],
  ["06", "Prepare", "Approvals, estimates, working drawings and construction planning are brought together."],
  ["07", "Build", "The design moves to site with professional supervision and quality-focused execution."],
  ["08", "Handover", "The completed project is reviewed, finished and handed over with clarity."],
] as const;
