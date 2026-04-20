import { useState, useEffect, useRef, useCallback } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://sfusgwchqenjbbfrvptz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XI-usskHrNmNXEYA6noWng_-Ur8c9ib";

// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
const sb = {
  async query(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    if (options.select) url += `select=${options.select}&`;
    if (options.eq) Object.entries(options.eq).forEach(([k, v]) => { url += `${k}=eq.${encodeURIComponent(v)}&`; });
    if (options.order) url += `order=${options.order}&`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" } });
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async upsert(table, data, onConflict) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async update(table, data, eq) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    Object.entries(eq).forEach(([k, v]) => { url += `${k}=eq.${encodeURIComponent(v)}&`; });
    const res = await fetch(url, {
      method: "PATCH",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(table, eq) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    Object.entries(eq).forEach(([k, v]) => { url += `${k}=eq.${encodeURIComponent(v)}&`; });
    await fetch(url, { method: "DELETE", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  },
};

const ROLES = ["HRBP","Learning & Dev","HR Ops","HR Systems","People Analytics","Recruiting"];
const COMPETENCIES = ["HR Domain Depth","Technical Fluency","Ownership & PM","Strategic Leadership","Stakeholder Management","Data Literacy"];
const BRAND = { wavBlue:"#0032FF", deepBlue:"#071945", foamBlue:"#EAF3F6", aquaBlue:"#071C77", green:"#21CBA6", orange:"#FF5D00", purple:"#500B71" };

const COMP_COLORS = {
  "HR Domain Depth":        { bg: "#E6EBFF", border: "#0032FF", dot: "#071C77" },
  "Technical Fluency":      { bg: "#E0F8F3", border: "#21CBA6", dot: "#0F8A6E" },
  "Ownership & PM":         { bg: "#FFF0E8", border: "#FF5D00", dot: "#CC4A00" },
  "Strategic Leadership":   { bg: "#F0E8F5", border: "#500B71", dot: "#500B71" },
  "Stakeholder Management": { bg: "#E6EBFF", border: "#071C77", dot: "#0032FF" },
  "Data Literacy":          { bg: "#EAF3F6", border: "#071945", dot: "#071945" },
};
const LEVEL_LABELS = ["","Awareness","Foundation","Practitioner","Advanced","Expert"];

// ── FALLBACK TAXONOMY — used immediately, Supabase overrides when available ──
const FALLBACK_TAXONOMY = [
  {competency_area:"HR Domain Depth",role:"HRBP",skill_name:"Employee relations",base_level:3,notes:"Managing complex escalations, grievances and sensitive workplace matters."},
  {competency_area:"HR Domain Depth",role:"HRBP",skill_name:"HR Domain knowledge",base_level:5,notes:"Deep expertise in employment law, org design, and strategic HR advising."},
  {competency_area:"HR Domain Depth",role:"HRBP",skill_name:"HR processes",base_level:4,notes:"Understanding HR processes around onboarding, offboarding, performance, merit and promotion cycles."},
  {competency_area:"HR Domain Depth",role:"HRBP",skill_name:"Org design",base_level:4,notes:"Advising on spans, layers and role design to improve business alignment."},
  {competency_area:"HR Domain Depth",role:"HRBP",skill_name:"Talent management",base_level:4,notes:"Running calibrations, succession planning and career pathing with leaders."},
  {competency_area:"HR Domain Depth",role:"Learning & Dev",skill_name:"Learning Strategy",base_level:5,notes:"Owning the org's approach to learning aligned to business priorities."},
  {competency_area:"HR Domain Depth",role:"Learning & Dev",skill_name:"Curriculum design",base_level:4,notes:"Building programme architectures and scalable leadership journeys."},
  {competency_area:"HR Domain Depth",role:"Learning & Dev",skill_name:"Facilitation & Training",base_level:4,notes:"Designing and delivering engaging learning across multiple formats."},
  {competency_area:"HR Domain Depth",role:"Learning & Dev",skill_name:"Talent management",base_level:3,notes:"Building development infrastructure that supports the talent pipeline."},
  {competency_area:"HR Domain Depth",role:"HR Ops",skill_name:"HR Domain knowledge",base_level:4,notes:"Broad knowledge of payroll, benefits and compliance to resolve employee queries."},
  {competency_area:"HR Domain Depth",role:"HR Ops",skill_name:"Process & workflow SOP",base_level:5,notes:"Executing and auditing transactional workflows with strict SLA adherence."},
  {competency_area:"HR Domain Depth",role:"HR Ops",skill_name:"System knowledge",base_level:4,notes:"End-user navigation, record management and HRIS troubleshooting."},
  {competency_area:"HR Domain Depth",role:"HR Ops",skill_name:"HR processes",base_level:5,notes:"Standardising onboarding, offboarding and leave workflows compliantly."},
  {competency_area:"HR Domain Depth",role:"HR Systems",skill_name:"HR processes",base_level:4,notes:"Configuring HRIS approval routing and rules to automate HR workflows."},
  {competency_area:"HR Domain Depth",role:"HR Systems",skill_name:"HR Domain knowledge",base_level:4,notes:"Understanding comp, talent cycles and org hierarchies to build accurate system logic."},
  {competency_area:"HR Domain Depth",role:"HR Systems",skill_name:"System knowledge",base_level:5,notes:"Advanced tenant configuration, API management and release testing."},
  {competency_area:"HR Domain Depth",role:"People Analytics",skill_name:"Workforce planning",base_level:4,notes:"Modelling headcount scenarios and analysing attrition to inform hiring plans."},
  {competency_area:"HR Domain Depth",role:"People Analytics",skill_name:"Talent management",base_level:3,notes:"Understanding talent processes and providing analysis that supports performance cycles."},
  {competency_area:"HR Domain Depth",role:"People Analytics",skill_name:"System knowledge",base_level:4,notes:"Managing data lakes, ETL pipelines and HRIS systems to support analytical workflows."},
  {competency_area:"HR Domain Depth",role:"People Analytics",skill_name:"HR processes",base_level:4,notes:"Understanding all HR processes and mapping process data to analyse cycle times and identify bottlenecks."},
  {competency_area:"HR Domain Depth",role:"People Analytics",skill_name:"HR Domain knowledge",base_level:4,notes:"Deep enough HR knowledge to frame the right analytical questions."},
  {competency_area:"HR Domain Depth",role:"Recruiting",skill_name:"Recruiting strategy",base_level:5,notes:"Designing end-to-end talent acquisition approach aligned to business growth."},
  {competency_area:"HR Domain Depth",role:"Recruiting",skill_name:"Talent market knowledge",base_level:5,notes:"Deep understanding of talent landscape, competitor hiring and comp benchmarks."},
  {competency_area:"HR Domain Depth",role:"Recruiting",skill_name:"Interview design",base_level:4,notes:"Building structured, bias-reducing interview frameworks that predict performance."},
  {competency_area:"HR Domain Depth",role:"Recruiting",skill_name:"HR processes",base_level:3,notes:"Managing ATS workflows, pipeline stages and offer approvals."},
  {competency_area:"Technical Fluency",role:"HRBP",skill_name:"System Operations",base_level:3,notes:"Basic HRIS navigation to access data, run reports and complete transactions."},
  {competency_area:"Technical Fluency",role:"HRBP",skill_name:"Operational rigor",base_level:3,notes:"Maintaining accurate records and following through on commitments consistently."},
  {competency_area:"Technical Fluency",role:"Learning & Dev",skill_name:"System Operations",base_level:5,notes:"Managing LMS admin, SCORM hosting and completion tracking at scale."},
  {competency_area:"Technical Fluency",role:"Learning & Dev",skill_name:"Content authoring tools",base_level:4,notes:"Using authoring platforms (Articulate, Rise) to build digital learning content."},
  {competency_area:"Technical Fluency",role:"Learning & Dev",skill_name:"Knowledge Management",base_level:3,notes:"Organising learning resources so the right content reaches the right people."},
  {competency_area:"Technical Fluency",role:"HR Ops",skill_name:"Operational rigor",base_level:5,notes:"Relentless focus on data accuracy, queue management and SOP improvement."},
  {competency_area:"Technical Fluency",role:"HR Ops",skill_name:"Process design",base_level:3,notes:"Mapping workflows and redesigning transactional processes for speed and compliance."},
  {competency_area:"Technical Fluency",role:"HR Ops",skill_name:"System Operations",base_level:5,notes:"Managing high-volume case logging, routing and resolution in case management systems."},
  {competency_area:"Technical Fluency",role:"HR Ops",skill_name:"Workflow automation",base_level:4,notes:"Implementing automations (approvals, notifications, syncs) to reduce manual effort."},
  {competency_area:"Technical Fluency",role:"HR Systems",skill_name:"Process design",base_level:4,notes:"Translating HR requirements into system config — approval chains, rules, access."},
  {competency_area:"Technical Fluency",role:"HR Systems",skill_name:"System thinking",base_level:5,notes:"Understanding how HRIS changes cascade across modules, integrations and reports."},
  {competency_area:"Technical Fluency",role:"HR Systems",skill_name:"Operational rigor",base_level:5,notes:"Maintaining system integrity through rigorous change management and release testing."},
  {competency_area:"Technical Fluency",role:"HR Systems",skill_name:"Integration",base_level:4,notes:"Managing API integrations and data sync between HRIS and adjacent systems."},
  {competency_area:"Technical Fluency",role:"HR Systems",skill_name:"HRIS configuration",base_level:5,notes:"Deep expertise in configuring HRIS modules, security roles and dashboards."},
  {competency_area:"Technical Fluency",role:"People Analytics",skill_name:"System thinking",base_level:5,notes:"Understanding how HR data flows and how architecture decisions affect data quality."},
  {competency_area:"Technical Fluency",role:"People Analytics",skill_name:"Data infrastructure and modeling",base_level:5,notes:"Building people data pipelines and dimensional models that power analytics."},
  {competency_area:"Technical Fluency",role:"People Analytics",skill_name:"Operational rigor",base_level:5,notes:"Ensuring reproducible workflows and strict data privacy standards in all analysis."},
  {competency_area:"Technical Fluency",role:"People Analytics",skill_name:"Data visualization and insights",base_level:5,notes:"Translating analytical outputs into compelling visual narratives using BI tools."},
  {competency_area:"Technical Fluency",role:"People Analytics",skill_name:"Research & statistics methods",base_level:4,notes:"Applying statistical techniques (regression, survival analysis) to people data questions."},
  {competency_area:"Technical Fluency",role:"Recruiting",skill_name:"System Operations",base_level:5,notes:"Managing the ATS end-to-end — posting, pipeline config, comms and reporting."},
  {competency_area:"Technical Fluency",role:"Recruiting",skill_name:"Operational rigor",base_level:5,notes:"Maintaining clean candidate data and consistent structured interview adherence."},
  {competency_area:"Ownership & PM",role:"HRBP",skill_name:"Ownership",base_level:5,notes:"End-to-end accountability for HR projects within client groups, minimal direction needed."},
  {competency_area:"Ownership & PM",role:"HRBP",skill_name:"Execution & Delivery",base_level:3,notes:"Managing timelines across priorities and delivering outputs on time."},
  {competency_area:"Ownership & PM",role:"HRBP",skill_name:"Change management",base_level:4,notes:"Designing stakeholder comms and resistance management for org changes."},
  {competency_area:"Ownership & PM",role:"Learning & Dev",skill_name:"Ownership",base_level:5,notes:"Full programme accountability — scoping, vendor management, budget and learner experience."},
  {competency_area:"Ownership & PM",role:"Learning & Dev",skill_name:"Vendor management",base_level:4,notes:"Sourcing and performance-managing learning vendors to deliver quality programmes."},
  {competency_area:"Ownership & PM",role:"Learning & Dev",skill_name:"Change management",base_level:4,notes:"Driving adoption of new programmes by building manager advocacy and engagement."},
  {competency_area:"Ownership & PM",role:"Learning & Dev",skill_name:"Budget management",base_level:3,notes:"Tracking L&D spend and making trade-off decisions to maximise learning impact."},
  {competency_area:"Ownership & PM",role:"HR Ops",skill_name:"Ownership",base_level:5,notes:"Owning HR processes end-to-end — quality, compliance and SLA performance."},
  {competency_area:"Ownership & PM",role:"HR Ops",skill_name:"SLA management",base_level:4,notes:"Monitoring KPIs and implementing corrective actions when SLAs are at risk."},
  {competency_area:"Ownership & PM",role:"HR Ops",skill_name:"Change management",base_level:4,notes:"Managing people and process transitions for system upgrades and policy changes."},
  {competency_area:"Ownership & PM",role:"HR Ops",skill_name:"Continuous improvement",base_level:5,notes:"Identifying inefficiencies and implementing sustainable process improvements."},
  {competency_area:"Ownership & PM",role:"HR Systems",skill_name:"Ownership",base_level:5,notes:"Product ownership of HR tech — roadmap, prioritisation and delivery end-to-end."},
  {competency_area:"Ownership & PM",role:"HR Systems",skill_name:"Continuous improvement",base_level:5,notes:"Evaluating platform releases and proactively upgrading system capabilities."},
  {competency_area:"Ownership & PM",role:"HR Systems",skill_name:"Execution & Delivery",base_level:4,notes:"Managing HRIS project timelines, testing cycles and go-live readiness."},
  {competency_area:"Ownership & PM",role:"HR Systems",skill_name:"Vendor management",base_level:3,notes:"Managing HRIS vendor relationships, SLAs and product roadmap discussions."},
  {competency_area:"Ownership & PM",role:"People Analytics",skill_name:"Ownership",base_level:5,notes:"Owning the full analytics lifecycle — from question framing through insight delivery."},
  {competency_area:"Ownership & PM",role:"People Analytics",skill_name:"Execution & Delivery",base_level:4,notes:"Scoping projects clearly and delivering insights on schedule with appropriate caveats."},
  {competency_area:"Ownership & PM",role:"People Analytics",skill_name:"Continuous improvement",base_level:4,notes:"Iterating on models and data products based on stakeholder feedback."},
  {competency_area:"Ownership & PM",role:"Recruiting",skill_name:"Ownership",base_level:5,notes:"Full accountability for req management, pipeline health and candidate experience."},
  {competency_area:"Ownership & PM",role:"Recruiting",skill_name:"Capacity planning",base_level:4,notes:"Forecasting hiring volumes and flagging recruiter capacity constraints proactively."},
  {competency_area:"Ownership & PM",role:"Recruiting",skill_name:"Budget management",base_level:4,notes:"Tracking recruiting spend and optimising channel mix for cost-per-hire efficiency."},
  {competency_area:"Strategic Leadership",role:"HRBP",skill_name:"Business acumen",base_level:5,notes:"Deep understanding of your client group's business model to shape people strategy."},
  {competency_area:"Strategic Leadership",role:"HRBP",skill_name:"Cross-function collaboration",base_level:4,notes:"Building trusted relationships across HR COEs, Finance and Legal."},
  {competency_area:"Strategic Leadership",role:"HRBP",skill_name:"Org diagnosis",base_level:5,notes:"Assessing org health and recommending evidence-based interventions to leaders."},
  {competency_area:"Strategic Leadership",role:"HRBP",skill_name:"Strategic partnering",base_level:4,notes:"Bringing people insights to business planning cycles as a thought partner."},
  {competency_area:"Strategic Leadership",role:"HRBP",skill_name:"Change leadership",base_level:4,notes:"Leading the human side of transformation — coaching leaders and sustaining momentum."},
  {competency_area:"Strategic Leadership",role:"Learning & Dev",skill_name:"L&D strategy",base_level:4,notes:"Translating capability needs into a multi-year L&D strategy with measurable outcomes."},
  {competency_area:"Strategic Leadership",role:"Learning & Dev",skill_name:"Business acumen",base_level:4,notes:"Understanding how the business makes money to target learning where it matters most."},
  {competency_area:"Strategic Leadership",role:"Learning & Dev",skill_name:"Skills gap analysis",base_level:3,notes:"Conducting needs assessments to identify capability gaps at role or org level."},
  {competency_area:"Strategic Leadership",role:"Learning & Dev",skill_name:"Culture & engagement",base_level:3,notes:"Designing learning that reinforces cultural behaviours and builds belonging."},
  {competency_area:"Strategic Leadership",role:"HR Ops",skill_name:"Process innovation",base_level:3,notes:"Rethinking HR service delivery using technology or new operating models."},
  {competency_area:"Strategic Leadership",role:"HR Ops",skill_name:"HR strategy basics",base_level:3,notes:"Understanding enough HR strategy to align operational priorities accordingly."},
  {competency_area:"Strategic Leadership",role:"HR Ops",skill_name:"Business acumen",base_level:2,notes:"Basic awareness of how the business operates to shape Ops decisions."},
  {competency_area:"Strategic Leadership",role:"HR Systems",skill_name:"HR tech strategy",base_level:4,notes:"Building the technology roadmap and sequencing implementations for the HR function."},
  {competency_area:"Strategic Leadership",role:"HR Systems",skill_name:"Business acumen",base_level:4,notes:"Understanding business workflows to configure systems that reflect how work gets done."},
  {competency_area:"Strategic Leadership",role:"HR Systems",skill_name:"Vendor evaluation",base_level:3,notes:"Running RFPs and scoring vendors against technical, commercial and strategic fit."},
  {competency_area:"Strategic Leadership",role:"HR Systems",skill_name:"Digital transformation",base_level:3,notes:"Contributing to HR's digital transformation — driving self-service adoption and digital literacy."},
  {competency_area:"Strategic Leadership",role:"People Analytics",skill_name:"Automation and innovation",base_level:5,notes:"Identifying where AI/ML can replace manual processes and leading implementation."},
  {competency_area:"Strategic Leadership",role:"People Analytics",skill_name:"Business acumen",base_level:4,notes:"Framing analytics projects around strategic decisions, not just data availability."},
  {competency_area:"Strategic Leadership",role:"People Analytics",skill_name:"Research design",base_level:4,notes:"Designing studies with appropriate controls and validity checks to ensure defensible outputs."},
  {competency_area:"Strategic Leadership",role:"People Analytics",skill_name:"People strategy input",base_level:4,notes:"Synthesising findings into recommendations that influence talent strategy at senior level."},
  {competency_area:"Strategic Leadership",role:"Recruiting",skill_name:"Talent strategy",base_level:4,notes:"Shaping the org's talent acquisition approach aligned to 12–24 month business plans."},
  {competency_area:"Strategic Leadership",role:"Recruiting",skill_name:"Employer branding",base_level:4,notes:"Developing the EVP and careers presence that differentiates the org in the talent market."},
  {competency_area:"Strategic Leadership",role:"Recruiting",skill_name:"Workforce planning",base_level:3,notes:"Translating business growth plans into hiring forecasts with HRBPs and Finance."},
  {competency_area:"Strategic Leadership",role:"Recruiting",skill_name:"DEI in hiring",base_level:3,notes:"Embedding inclusive hiring practices and tracking representation across the funnel."},
  {competency_area:"Stakeholder Management",role:"HRBP",skill_name:"Business partnering",base_level:5,notes:"Strategic relationships with senior leaders who see you as a thought partner."},
  {competency_area:"Stakeholder Management",role:"HRBP",skill_name:"Cross-team collaboration",base_level:5,notes:"Working across HR COEs to deliver integrated people solutions for client groups."},
  {competency_area:"Stakeholder Management",role:"HRBP",skill_name:"Influencing without authority",base_level:5,notes:"Shaping people decisions through evidence and credibility rather than positional power."},
  {competency_area:"Stakeholder Management",role:"HRBP",skill_name:"Executive engagement",base_level:4,notes:"Communicating confidently at C-suite and VP level with tailored, credible messaging."},
  {competency_area:"Stakeholder Management",role:"Learning & Dev",skill_name:"Business partnering",base_level:4,notes:"Engaging leaders to diagnose learning needs and position L&D as a strategic investment."},
  {competency_area:"Stakeholder Management",role:"Learning & Dev",skill_name:"Cross-team collaboration",base_level:4,notes:"Co-designing programmes with HRBPs, HR Ops and vendors for operational feasibility."},
  {competency_area:"Stakeholder Management",role:"Learning & Dev",skill_name:"Influencing without authority",base_level:3,notes:"Gaining manager support for learning time, investment and behaviour change."},
  {competency_area:"Stakeholder Management",role:"Learning & Dev",skill_name:"Consultation",base_level:3,notes:"Using structured needs assessment to diagnose the real problem before recommending solutions."},
  {competency_area:"Stakeholder Management",role:"HR Ops",skill_name:"Cross-team collaboration",base_level:4,notes:"Partnering with COEs, Finance and IT to deliver seamless employee experience."},
  {competency_area:"Stakeholder Management",role:"HR Ops",skill_name:"Influencing without authority",base_level:3,notes:"Advocating for process improvements with teams outside HR Ops diplomatically."},
  {competency_area:"Stakeholder Management",role:"HR Ops",skill_name:"Executive engagement",base_level:2,notes:"Preparing clear operational reports and escalation summaries for HR leadership."},
  {competency_area:"Stakeholder Management",role:"HR Ops",skill_name:"Consultation",base_level:3,notes:"Acting as a knowledgeable first contact — diagnosing and routing employee queries."},
  {competency_area:"Stakeholder Management",role:"HR Systems",skill_name:"Cross-team collaboration",base_level:5,notes:"Gathering requirements and managing dependencies across HR, IT and business units."},
  {competency_area:"Stakeholder Management",role:"HR Systems",skill_name:"Influencing without authority",base_level:4,notes:"Getting stakeholders to prioritise HRIS projects and adopt new system features."},
  {competency_area:"Stakeholder Management",role:"HR Systems",skill_name:"Executive engagement",base_level:3,notes:"Presenting system roadmaps and project status to senior leaders in plain language."},
  {competency_area:"Stakeholder Management",role:"HR Systems",skill_name:"Consultation",base_level:4,notes:"Translating business requirements into system specs by surfacing unstated needs."},
  {competency_area:"Stakeholder Management",role:"People Analytics",skill_name:"Cross-team collaboration",base_level:5,notes:"Embedding as a trusted analytical partner across HR COEs and business units."},
  {competency_area:"Stakeholder Management",role:"People Analytics",skill_name:"Influencing without authority",base_level:4,notes:"Presenting counterintuitive findings and sustaining the conversation until insights drive action."},
  {competency_area:"Stakeholder Management",role:"People Analytics",skill_name:"Executive engagement",base_level:4,notes:"Distilling complex analysis into crisp executive narratives with appropriate caveats."},
  {competency_area:"Stakeholder Management",role:"People Analytics",skill_name:"Consultation",base_level:4,notes:"Reframing vague people questions into well-scoped analytical problems with clear success criteria."},
  {competency_area:"Stakeholder Management",role:"Recruiting",skill_name:"Cross-team collaboration",base_level:3,notes:"Coordinating across hiring managers, panels, HR Ops and Comp to keep hiring moving."},
  {competency_area:"Stakeholder Management",role:"Recruiting",skill_name:"Business partnering",base_level:5,notes:"Trusted advisor to hiring managers — bringing market insight and challenging unrealistic requirements."},
  {competency_area:"Stakeholder Management",role:"Recruiting",skill_name:"Executive engagement",base_level:4,notes:"Presenting pipeline updates and market intelligence to senior leaders with clear recommendations."},
  {competency_area:"Stakeholder Management",role:"Recruiting",skill_name:"Agency management",base_level:4,notes:"Briefing and holding agencies accountable to quality, diversity and delivery standards."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"HR metrics",base_level:3,notes:"Understanding key HR metrics, how they are calculated and defined, to inform leader conversations."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"Data Interpretation",base_level:4,notes:"Translating dashboard metrics into context and understanding metrics to have meaningful conversations with leaders."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"Data Storytelling",base_level:4,notes:"Framing people data in business language to land recommendations with leaders."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"Reporting & Analysis",base_level:3,notes:"Pulling HR reports to prepare business reviews and necessary analysis."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"Data governance",base_level:3,notes:"Handling sensitive employee data compliantly and following access protocols."},
  {competency_area:"Data Literacy",role:"HRBP",skill_name:"AI Literacy",base_level:2,notes:"Knowing how to use GenAI to draft communications and summarise policies — with sound human judgment on outputs."},
  {competency_area:"Data Literacy",role:"Learning & Dev",skill_name:"HR metrics",base_level:4,notes:"Tracking completion, satisfaction and downstream impact to evaluate programme effectiveness."},
  {competency_area:"Data Literacy",role:"Learning & Dev",skill_name:"Data Interpretation",base_level:4,notes:"Interpreting learning analytics to identify engagement drop-off and curriculum gaps."},
  {competency_area:"Data Literacy",role:"Learning & Dev",skill_name:"Data Storytelling",base_level:4,notes:"Presenting learning impact to stakeholders to build the case for L&D investment."},
  {competency_area:"Data Literacy",role:"Learning & Dev",skill_name:"Reporting & Analysis",base_level:3,notes:"Building dashboards that track participation, completion and learner feedback."},
  {competency_area:"Data Literacy",role:"Learning & Dev",skill_name:"AI Literacy",base_level:2,notes:"Using AI to accelerate content creation and personalise pathways — with critical judgment on outputs."},
  {competency_area:"Data Literacy",role:"HR Ops",skill_name:"HR metrics",base_level:3,notes:"Monitoring SLA adherence, ticket volume and error rates to flag service quality issues."},
  {competency_area:"Data Literacy",role:"HR Ops",skill_name:"Data Interpretation",base_level:3,notes:"Reading operational dashboards to understand workload patterns and data quality issues."},
  {competency_area:"Data Literacy",role:"HR Ops",skill_name:"Data Storytelling",base_level:3,notes:"Summarising operational performance for HR leadership in regular service reviews."},
  {competency_area:"Data Literacy",role:"HR Ops",skill_name:"Reporting & Analysis",base_level:3,notes:"Enforcing data entry standards and running audits to maintain a clean HRIS."},
  {competency_area:"Data Literacy",role:"HR Ops",skill_name:"AI Literacy",base_level:3,notes:"Using AI to automate routine tasks (comms, query triage) and knowing when to escalate to a human."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"HR metrics",base_level:4,notes:"Building configs and report structures that generate the metrics HR depends on accurately."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"Data Interpretation",base_level:3,notes:"Reading system audit logs and error reports to diagnose configuration and data issues."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"Data Storytelling",base_level:3,notes:"Presenting system health and adoption data to HR stakeholders in non-technical format."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"Reporting & Analysis",base_level:5,notes:"Designing the reporting architecture — dashboards, calculated fields and scheduled outputs."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"Data governance",base_level:5,notes:"Establishing validation rules and access permissions that prevent bad data entering the system."},
  {competency_area:"Data Literacy",role:"HR Systems",skill_name:"AI Literacy",base_level:4,notes:"Evaluating AI modules, governing AI access in HRIS, and configuring AI-automated workflows."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"HR metrics",base_level:5,notes:"Defining and governing the metrics the org uses to measure workforce health consistently."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"Data Interpretation",base_level:5,notes:"Conducting advanced analysis (regression, survival) and interpreting findings for strategic narratives."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"Data Storytelling",base_level:5,notes:"Translating sophisticated analysis into executive narratives that shift mindsets and drive action."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"Reporting & Analysis",base_level:5,notes:"Building self-serve dashboards and data products that enable the broader HR function."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"Data governance",base_level:5,notes:"Defining the data dictionary, standardising metric definitions and overseeing ethical use of predictive models."},
  {competency_area:"Data Literacy",role:"People Analytics",skill_name:"AI Literacy",base_level:4,notes:"Applying LLMs to unstructured data, building analytical agents, and automating workflows and processes."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"HR metrics",base_level:4,notes:"Tracking time-to-fill, source-of-hire and offer acceptance to optimise the hiring funnel."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"Data Interpretation",base_level:3,notes:"Analysing funnel conversion and time-to-fill trends to identify sourcing bottlenecks."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"Data Storytelling",base_level:3,notes:"Presenting recruiting performance and market insights to managers and senior leaders."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"Reporting & Analysis",base_level:3,notes:"Building dashboards with real-time visibility into pipeline health and diversity metrics."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"Data governance",base_level:4,notes:"Ensuring candidate data is handled compliantly and ATS records are accurate and complete."},
  {competency_area:"Data Literacy",role:"Recruiting",skill_name:"AI Literacy",base_level:2,notes:"Using AI sourcing and screening tools — and actively mitigating algorithmic bias in candidate selection."},
];

function genAnonId() {
  return "anon_" + Math.random().toString(36).slice(2, 8);
}

// ── COMPETENCY DRILL-DOWN SPIDER ──────────────────────────────────────────────
function CompetencySpider({ skills, color }) {
  if (!skills.length) return null;
  const N = skills.length;
  const W = 420, H = 420, cx = 210, cy = 210, R = 110;
  const getCoord = (i, val, maxVal = 5) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (val / maxVal) * R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const getLabelCoord = (i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const dist = R + 52;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };
  const wrapLabel = (text) => {
    if (text.length <= 11) return [text];
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= 11) { cur = (cur + " " + w).trim(); }
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  };
  const reqPoints  = skills.map((s, i) => { const {x,y} = getCoord(i, s.required_level); return `${x},${y}`; }).join(" ");
  const selfPoints = skills.map((s, i) => { const {x,y} = getCoord(i, s.self_assessed_level || 0); return `${x},${y}`; }).join(" ");
  const hasAny = skills.some(s => s.self_assessed_level != null);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible", maxWidth: W }}>
      {[1,2,3,4,5].map(ring => (
        <polygon key={ring} points={skills.map((_,i) => { const {x,y}=getCoord(i,ring); return `${x},${y}`; }).join(" ")}
          fill={ring%2===0?"rgba(0,0,0,0.02)":"none"} stroke="#E5E7EB" strokeWidth="0.8" />
      ))}
      {skills.map((_,i) => { const {x,y} = getCoord(i,5); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="0.8"/>; })}
      {hasAny && skills.map((s, i) => {
        if (!s.self_assessed_level) return null;
        const gap = s.required_level - s.self_assessed_level;
        const pReq = getCoord(i, s.required_level);
        const pSelf = getCoord(i, s.self_assessed_level);
        if (gap > 0) return <polygon key={`gap-${i}`} points={`${cx},${cy} ${pSelf.x},${pSelf.y} ${pReq.x},${pReq.y}`} fill="rgba(239,68,68,0.15)" stroke="none" />;
        else if (gap < 0) { const pAbove = getCoord(i, s.self_assessed_level); const pReqP = getCoord(i, s.required_level); return <polygon key={`surplus-${i}`} points={`${cx},${cy} ${pReqP.x},${pReqP.y} ${pAbove.x},${pAbove.y}`} fill="rgba(16,185,129,0.18)" stroke="none" />; }
        return null;
      })}
      <polygon points={reqPoints} fill="rgba(7,25,69,0.05)" stroke="#071945" strokeWidth="2" strokeDasharray="5,3" />
      {hasAny && <polygon points={selfPoints} fill="rgba(0,50,255,0.10)" stroke="#0032FF" strokeWidth="2.5" />}
      {skills.map((s, i) => { const {x,y} = getCoord(i, s.required_level); const gap = s.self_assessed_level != null ? s.required_level - s.self_assessed_level : 0; return <circle key={`rdot-${i}`} cx={x} cy={y} r={gap > 0 ? 4 : 3} fill={gap > 0 ? "#FF5D00" : "#071945"} opacity={0.9} />; })}
      {hasAny && skills.map((s, i) => { if (!s.self_assessed_level) return null; const {x,y} = getCoord(i, s.self_assessed_level); const gap = s.required_level - s.self_assessed_level; return <circle key={`sdot-${i}`} cx={x} cy={y} r={4} fill={gap > 0 ? "#0032FF" : "#21CBA6"} />; })}
      {skills.map((s, i) => {
        const lp = getLabelCoord(i);
        const anchor = lp.x < cx - 8 ? "end" : lp.x > cx + 8 ? "start" : "middle";
        const gap = s.self_assessed_level != null ? s.required_level - s.self_assessed_level : null;
        const labelColor = gap === null ? "#9CA3AF" : gap > 1 ? "#DC2626" : gap > 0 ? "#D97706" : "#059669";
        const lines = wrapLabel(s.skill_name);
        const lineH = 12;
        const totalH = lines.length * lineH;
        const baseY = lp.y - totalH / 2 + lineH / 2;
        return <g key={`label-${i}`}>{lines.map((line, li) => <text key={li} x={lp.x} y={baseY + li * lineH} textAnchor={anchor} dominantBaseline="central" style={{ fontSize:9.5, fontFamily:"DM Sans, sans-serif", fill:labelColor, fontWeight:700 }}>{line}</text>)}</g>;
      })}
      {[1,2,3,4,5].map(r => <text key={r} x={cx+4} y={getCoord(0,r).y+1} style={{ fontSize:7.5, fill:"#C4C4C4", fontFamily:"DM Sans, sans-serif" }}>{r}</text>)}
      <g transform={`translate(${cx - 100}, ${H - 24})`}>
        <line x1={0} y1={6} x2={14} y2={6} stroke="#071945" strokeWidth="2" strokeDasharray="4,2"/>
        <text x={18} y={10} style={{ fontSize:9.5, fill:"#071945", fontFamily:"DM Sans, sans-serif" }}>Required</text>
        <line x1={78} y1={6} x2={92} y2={6} stroke="#0032FF" strokeWidth="2.5"/>
        <text x={96} y={10} style={{ fontSize:9.5, fill:"#0032FF", fontFamily:"DM Sans, sans-serif" }}>You</text>
        <rect x={130} y={2} width={10} height={8} fill="rgba(255,93,0,0.25)" rx={2}/>
        <text x={144} y={10} style={{ fontSize:9.5, fill:"#CC4A00", fontFamily:"DM Sans, sans-serif" }}>Gap</text>
        <rect x={178} y={2} width={10} height={8} fill="rgba(33,203,166,0.3)" rx={2}/>
        <text x={192} y={10} style={{ fontSize:9.5, fill:"#0F8A6E", fontFamily:"DM Sans, sans-serif" }}>Above</text>
      </g>
    </svg>
  );
}

// ── SPIDER CHART ──────────────────────────────────────────────────────────────
function SpiderChart({ skills, activeComp, onCompClick }) {
  const W = 420, H = 420, cx = 210, cy = 210, R = 120;
  const comps = COMPETENCIES;
  const N = comps.length;
  const getCoord = (i, val, maxVal = 5) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (val / maxVal) * R;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const getLabelCoord = (i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: cx + (R + 52) * Math.cos(angle), y: cy + (R + 52) * Math.sin(angle) };
  };
  const avgByComp = (key) => comps.map((c) => {
    const s = skills.filter((sk) => sk.competency_area === c && sk[key] != null);
    return s.length ? s.reduce((a, b) => a + b[key], 0) / s.length : 0;
  });
  const required = avgByComp("required_level");
  const assessed = avgByComp("self_assessed_level");
  const polyPoints = (vals) => vals.map((v, i) => { const { x, y } = getCoord(i, v); return `${x},${y}`; }).join(" ");
  const wrapLabel = (text) => {
    if (text.length <= 13) return [text];
    const words = text.split(" "); const lines = []; let cur = "";
    for (const w of words) { if ((cur + " " + w).trim().length <= 13) { cur = (cur + " " + w).trim(); } else { if (cur) lines.push(cur); cur = w; } }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", maxWidth: W }}>
      {[1,2,3,4,5].map(ring => <polygon key={ring} points={comps.map((_, i) => { const {x,y} = getCoord(i, ring); return `${x},${y}`; }).join(" ")} fill={ring % 2 === 0 ? "rgba(0,0,0,0.02)" : "none"} stroke="#E5E7EB" strokeWidth="0.8" />)}
      {comps.map((c, i) => { const { x, y } = getCoord(i, 5); const isActive = activeComp === c; return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={isActive ? "#4F46E5" : "#E5E7EB"} strokeWidth={isActive ? 1.5 : 0.8} />; })}
      <polygon points={polyPoints(required)} fill="rgba(7,25,69,0.05)" stroke="#071945" strokeWidth="1.5" strokeDasharray="5,3" />
      {assessed.some(v => v > 0) && <polygon points={polyPoints(assessed)} fill="rgba(0,50,255,0.10)" stroke="#0032FF" strokeWidth="2.5" />}
      {comps.map((c, i) => {
        const lp = getLabelCoord(i); const dp = getCoord(i, 5); const isActive = activeComp === c;
        const anchor = lp.x < cx - 8 ? "end" : lp.x > cx + 8 ? "start" : "middle";
        const lines = wrapLabel(c); const lineH = 13; const totalH = lines.length * lineH; const baseY = lp.y - totalH / 2 + lineH / 2;
        const cc = COMP_COLORS[c];
        return (
          <g key={i} onClick={() => onCompClick(c)} style={{ cursor: "pointer" }}>
            <circle cx={dp.x} cy={dp.y} r={isActive ? 6 : 4} fill={isActive ? cc.dot : "#fff"} stroke={cc.dot} strokeWidth="1.5" />
            {isActive && <rect x={anchor==="end" ? lp.x - 80 : anchor==="start" ? lp.x - 4 : lp.x - 42} y={baseY - lineH * 0.8} width={84} height={totalH + 8} rx={4} fill={cc.bg} opacity={0.9} />}
            {lines.map((line, li) => <text key={li} x={lp.x} y={baseY + li * lineH} textAnchor={anchor} dominantBaseline="central" style={{ fontSize: 10, fontFamily: "DM Sans, sans-serif", fill: isActive ? cc.dot : "#374151", fontWeight: isActive ? 700 : 500 }}>{line}</text>)}
          </g>
        );
      })}
      {[1,2,3,4,5].map(r => <text key={r} x={cx + 4} y={getCoord(0, r).y + 1} style={{ fontSize: 7.5, fill: "#C4C4C4", fontFamily: "DM Sans, sans-serif" }}>{r}</text>)}
      <g transform={`translate(${cx - 80}, ${H - 24})`}>
        <line x1={0} y1={6} x2={14} y2={6} stroke="#071945" strokeWidth="1.5" strokeDasharray="4,2" />
        <text x={18} y={10} style={{ fontSize: 9.5, fill: "#071945", fontFamily: "DM Sans, sans-serif" }}>Required</text>
        <line x1={82} y1={6} x2={96} y2={6} stroke="#0032FF" strokeWidth="2.5" />
        <text x={100} y={10} style={{ fontSize: 9.5, fill: "#0032FF", fontFamily: "DM Sans, sans-serif" }}>You</text>
      </g>
    </svg>
  );
}

// ── SKILL ROW ─────────────────────────────────────────────────────────────────
function SkillRow({ skill, onUpdate, onRemove }) {
  const handleChange = (e) => {
    const val = e.target.value ? +e.target.value : null;
    onUpdate({ ...skill, self_assessed_level: val });
  };
  return (
    <div style={{ padding:"10px 0", borderBottom:"1px solid #EAF3F6" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#071945" }}>{skill.skill_name}</span>
            {skill.is_user_added && <span style={{ fontSize:9, background:"#FFF0E8", color:"#CC4A00", padding:"1px 5px", borderRadius:8, fontWeight:700 }}>ADDED</span>}
          </div>
          {skill.notes && <div style={{ fontSize:11, color:"#4A6B8A", marginTop:3, lineHeight:1.4 }}>{skill.notes}</div>}
        </div>
        <div style={{ minWidth:150, flexShrink:0 }}>
          <select value={skill.self_assessed_level || ""} onChange={handleChange}
            style={{ fontSize:12, padding:"4px 8px", borderRadius:6, border:"1px solid #B8CFE0", background:"#F5FAFC", color: skill.self_assessed_level ? "#071945" : "#4A6B8A", width:"100%" }}>
            <option value="">— rate yourself —</option>
            {[1,2,3,4,5].map(l => <option key={l} value={l}>{l} – {LEVEL_LABELS[l]}</option>)}
          </select>
        </div>
        <button onClick={() => onRemove(skill)} title="Remove skill"
          style={{ background:"none", border:"none", cursor:"pointer", color:"#B8CFE0", fontSize:16, padding:"0 4px", lineHeight:1, flexShrink:0, marginTop:2 }}>✕</button>
      </div>
    </div>
  );
}

// ── GAP COURSES COMPONENT ─────────────────────────────────────────────────────
function GapCourses({ skill, idx, gap, courseLevels, cc, statusColor, statusBg, statusLabel }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const skillEncoded = encodeURIComponent(`{${skill.skill_name}}`);
    const url = `${SUPABASE_URL}/rest/v1/course_catalog?skills_covered=cs.${skillEncoded}&select=title,provider,course_type,url,duration_hours,description,level&order=level`;
    fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter(c => courseLevels.includes(c.level));
          setCourses(filtered.slice(0, 3));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [skill.skill_name]);

  const levelColors = { beginner:{bg:"#E0F8F3",color:"#0F5E47"}, intermediate:{bg:"#DBEAFE",color:"#1E40AF"}, advanced:{bg:"#EDE9FE",color:"#4C1D95"}, all:{bg:"#EAF3F6",color:"#071945"} };
  const providerIcons = { "Udemy":"🎓","Coursera":"🎓","LinkedIn Learning":"💼","Internal":"🏢","eCornell":"🏛","SHRM":"📋","ATD":"📋","Workday":"⚙️","ServiceNow":"⚙️","Tableau / Salesforce":"📊","BetterUp":"🧠" };

  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #D6E4F0", padding:28, marginBottom:16, borderLeft:`4px solid ${cc.border}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:cc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:cc.dot }}>{idx + 1}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#071945" }}>{skill.skill_name}</div>
            <div style={{ fontSize:11, color:"#4A6B8A" }}>{skill.competency_area}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:"#4A6B8A" }}>You: {skill.self_assessed_level} → Need: {skill.required_level} ({LEVEL_LABELS[skill.required_level]})</span>
          <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:statusBg, padding:"2px 8px", borderRadius:10 }}>{statusLabel}</span>
        </div>
      </div>
      {loading ? (
        <div style={{ fontSize:12, color:"#4A6B8A", fontStyle:"italic", padding:"12px 0" }}>Finding matching courses…</div>
      ) : courses.length === 0 ? (
        <div style={{ fontSize:12, color:"#4A6B8A", fontStyle:"italic", padding:"8px 0" }}>No courses found for this skill yet — check back as the catalog grows.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {courses.map((course, i) => {
            const lc = levelColors[course.level] || levelColors.all;
            const icon = providerIcons[course.provider] || "📖";
            return (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", background:"#F8FAFD", borderRadius:12, border:"1px solid #EAF3F6" }}>
                <div style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#071945", lineHeight:1.3 }}>{course.title}</div>
                    <span style={{ fontSize:10, fontWeight:700, background:lc.bg, color:lc.color, padding:"2px 8px", borderRadius:10, whiteSpace:"nowrap", flexShrink:0 }}>{course.level}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#4A6B8A", lineHeight:1.5, marginBottom:8 }}>{course.description}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, color:"#071945", fontWeight:600 }}>{course.provider}</span>
                    {course.duration_hours && <span style={{ fontSize:11, color:"#4A6B8A" }}>⏱ {course.duration_hours}h</span>}
                    {course.url && <a href={course.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#0032FF", fontWeight:600, textDecoration:"none" }}>View course ↗</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("welcome");
  const [userId, setUserId] = useState(null);
  const [anonId, setAnonId] = useState("");
  const [profile, setProfile] = useState({ worker_type:"", role_title:"", role_level:"", career_goals:"", manager_feedback:"" });
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newSkill, setNewSkill] = useState({ competency_area:COMPETENCIES[0], skill_name:"", required_level:3, notes:"" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [dbReady] = useState(SUPABASE_URL !== "YOUR_SUPABASE_URL");
  const [activeComp, setActiveComp] = useState(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [taxonomy, setTaxonomy] = useState(FALLBACK_TAXONOMY);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);

  // ── Load taxonomy from Supabase on mount (upgrades fallback if available) ──
  useEffect(() => {
    const saved = localStorage.getItem("skill_mapper_anon_id");
    if (saved) setResumeId(saved);
    if (dbReady) {
      sb.query("competency_taxonomy", {
        select: "competency_area,role,skill_name,base_level,notes",
        order: "competency_area,skill_name"
      }).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTaxonomy(data);
          console.log(`✓ Taxonomy upgraded from Supabase: ${data.length} skills`);
        }
      }).catch(() => {
        console.log("Using fallback taxonomy — Supabase unavailable");
      });
    }
  }, []);

  const applyLevelAdjustment = (level, roleLevel) => {
    if (roleLevel === "Junior") return Math.max(1, level - 1);
    if (roleLevel === "Senior") return Math.min(5, level + 1);
    return level;
  };

  // ── KEY FIX: always pass tax explicitly, never rely on closure ──
  const buildSkills = (role, roleLevel, tax) =>
    tax.filter(t => t.role === role).map(t => ({
      competency_area:     t.competency_area,
      skill_name:          t.skill_name,
      required_level:      applyLevelAdjustment(t.base_level, roleLevel || ""),
      self_assessed_level: null,
      is_user_added:       false,
      notes:               t.notes || "",
    }));

  const handleRoleSelect = (role) => {
    setProfile(p => ({ ...p, role_title: role }));
    setSkills(buildSkills(role, profile.role_level, taxonomy));
  };

  const saveProfile = async (role, roleLevel) => {
    if (!role) return;
    setSaving(true);
    const newAnonId = genAnonId();
    setAnonId(newAnonId);

    // Taxonomy is always available (fallback pre-loaded, Supabase upgrades in background)
    const roleSkills = buildSkills(role, roleLevel || "", taxonomy);
    setSkills(roleSkills);
    console.log(`Built ${roleSkills.length} skills for ${role}`);

    if (dbReady) {
      try {
        const result = await sb.insert("users", {
          anonymous_id: newAnonId,
          worker_type: profile.worker_type || "HR",
          role_title: role,
          role_level: roleLevel || null,
          career_goals: profile.career_goals || null,
          manager_feedback: profile.manager_feedback || null,
        });
        const user = Array.isArray(result) ? result[0] : null;
        if (user && user.id) {
          setUserId(user.id);
          localStorage.setItem("skill_mapper_anon_id", newAnonId);
          localStorage.setItem("skill_mapper_user_id", user.id);
          for (const sk of roleSkills) {
            await sb.upsert("user_skills", {
              user_id: user.id,
              competency_area: sk.competency_area,
              skill_name: sk.skill_name,
              required_level: sk.required_level,
              self_assessed_level: null,
              is_user_added: false,
              notes: sk.notes || null,
            }, "user_id,competency_area,skill_name");
          }
        } else {
          const msg = result?.message || result?.error || JSON.stringify(result);
          console.error("Supabase insert error:", msg);
          alert("Could not save profile:\n" + msg);
        }
      } catch(e) {
        console.error("Save profile failed:", e);
        alert("Connection error: " + e.message);
      }
    } else {
      setUserId("local-" + Date.now());
      localStorage.setItem("skill_mapper_anon_id", newAnonId);
    }
    setSaving(false);
    setStep("skills");
  };

  const resumeSession = async () => {
    if (!resumeId || !dbReady) return;
    setSaving(true);
    try {
      const users = await sb.query("users", { eq: { anonymous_id: resumeId } });
      if (!users.length) { alert("Session ID not found."); setSaving(false); return; }
      const user = users[0];
      setUserId(user.id);
      setAnonId(user.anonymous_id);
      setProfile({ worker_type: user.worker_type, role_title: user.role_title, role_level: user.role_level || "", career_goals: user.career_goals || "", manager_feedback: user.manager_feedback || "" });
      const dbSkills = await sb.query("user_skills", { eq: { user_id: user.id }, order: "competency_area,skill_name" });
      if (dbSkills.length) {
        setSkills(dbSkills);
      } else {
        let tax = taxonomy;
        if (tax.length === 0) {
          const fresh = await sb.query("competency_taxonomy", { select:"competency_area,role,skill_name,base_level,notes", order:"competency_area,skill_name" });
          if (Array.isArray(fresh) && fresh.length > 0) { tax = fresh; setTaxonomy(fresh); }
        }
        setSkills(buildSkills(user.role_title, user.role_level || "", tax));
      }
      localStorage.setItem("skill_mapper_anon_id", user.anonymous_id);
      localStorage.setItem("skill_mapper_user_id", user.id);
      setStep("skills");
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const saveSkills = async () => {
    if (!userId) return;
    setSaving(true);
    if (dbReady) {
      try {
        for (const sk of skills) {
          await sb.upsert("user_skills", {
            user_id: userId, competency_area: sk.competency_area,
            skill_name: sk.skill_name, required_level: sk.required_level,
            self_assessed_level: sk.self_assessed_level || null,
            is_user_added: sk.is_user_added || false, notes: sk.notes || null,
          }, "user_id,competency_area,skill_name");
        }
        setSaveMsg("Saved ✓");
        setTimeout(() => setSaveMsg(""), 2000);
      } catch(e) { console.error(e); }
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (!newSkill.skill_name.trim()) return;
    setSkills(s => [...s, { ...newSkill, self_assessed_level: null, is_user_added: true }]);
    setNewSkill({ competency_area: COMPETENCIES[0], skill_name: "", required_level: 3, notes: "" });
    setShowAddForm(false);
  };

  const removeSkill = (skill) => setSkills(s => s.filter(x => !(x.skill_name === skill.skill_name && x.competency_area === skill.competency_area)));

  const updateSkill = async (updated) => {
    setSkills(s => s.map(x => (x.skill_name === updated.skill_name && x.competency_area === updated.competency_area) ? updated : x));
    const activeUserId = userId || localStorage.getItem("skill_mapper_user_id");
    if (activeUserId && dbReady) {
      try {
        await sb.upsert("user_skills", {
          user_id: activeUserId,
          competency_area: updated.competency_area,
          skill_name: updated.skill_name,
          required_level: updated.required_level,
          self_assessed_level: updated.self_assessed_level || null,
          is_user_added: updated.is_user_added || false,
          notes: updated.notes || null,
        }, "user_id,competency_area,skill_name");
      } catch(e) { console.error("Auto-save failed:", e); }
    }
  };

  const generateInsight = useCallback(async () => {
    if (insightLoading) return;
    setInsightLoading(true);
    setInsight("");
    const compData = COMPETENCIES.map(c => {
      const cs = skills.filter(s => s.competency_area === c && s.self_assessed_level != null);
      const all = skills.filter(s => s.competency_area === c);
      const totalGap = cs.reduce((a,s) => a + Math.max(0, s.required_level - s.self_assessed_level), 0);
      const avgRequired = all.length ? all.reduce((a,s) => a + s.required_level, 0) / all.length : 0;
      const avgSelf = cs.length ? cs.reduce((a,s) => a + s.self_assessed_level, 0) / cs.length : null;
      return { comp: c, totalGap, avgRequired: avgRequired.toFixed(1), avgSelf: avgSelf ? avgSelf.toFixed(1) : "not rated", rated: cs.length, total: all.length };
    }).filter(x => x.rated > 0).sort((a,b) => b.totalGap - a.totalGap);
    const skillData = skills.filter(s => s.self_assessed_level != null).map(s => ({ skill: s.skill_name, comp: s.competency_area, required: s.required_level, self: s.self_assessed_level, gap: s.required_level - s.self_assessed_level })).sort((a,b) => b.gap - a.gap);
    const biggestGapComp = compData[0];
    const strongestComp = [...compData].sort((a,b) => a.totalGap - b.totalGap)[0];
    const topGapSkills = skillData.filter(s => s.gap > 0).slice(0, 5);
    const prompt = `You are a warm career coach writing a short, punchy skill snapshot for an HR professional. Be direct, specific, and encouraging. Maximum 2 short sentences — no fluff, no preamble.
PERSON: ${profile.role_title}${profile.role_level ? ` (${profile.role_level})` : ""}
${profile.career_goals ? `GOALS: ${profile.career_goals}` : ""}
STRONGEST AREA: ${strongestComp?.comp || "N/A"}
BIGGEST GAP: ${biggestGapComp?.comp || "N/A"} (avg required ${biggestGapComp?.avgRequired}/5, avg self-rated ${biggestGapComp?.avgSelf}/5)
TOP 2 PRIORITY SKILLS: ${topGapSkills.slice(0,2).map(s=>`${s.skill} (you: ${s.self}/5, need: ${s.required}/5)`).join(" · ")}
Write exactly 2 sentences. Sentence 1: one strength + the biggest gap. Sentence 2: 2 priority skills + encouragement. Under 60 words total.`;
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setInsight(text);
    } catch(e) { setInsight("Unable to generate insight — check your connection."); }
    setInsightLoading(false);
  }, [skills, profile, insightLoading]);

  const grouped = COMPETENCIES.map(c => ({ comp: c, skills: skills.filter(s => s.competency_area === c) })).filter(g => g.skills.length);
  const assessed = skills.filter(s => s.self_assessed_level != null).length;

  const S = {
    app: { minHeight:"100vh", background:"#EAF3F6", fontFamily:"'DM Sans', sans-serif", color:"#071945" },
    header: { background:"#071945", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" },
    logo: { fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.5px" },
    tag: { fontSize:11, background:"rgba(255,255,255,0.15)", color:"#fff", padding:"2px 10px", borderRadius:20, fontWeight:600 },
    main: { maxWidth:860, margin:"0 auto", padding:"32px 20px" },
    card: { background:"#fff", borderRadius:16, border:"1px solid #D6E4F0", padding:28, marginBottom:20 },
    h1: { fontSize:26, fontWeight:800, color:"#071945", marginBottom:6, letterSpacing:"-0.5px" },
    h2: { fontSize:18, fontWeight:700, color:"#071945", marginBottom:4 },
    sub: { fontSize:14, color:"#4A6B8A", marginBottom:24, lineHeight:1.5 },
    label: { fontSize:12, fontWeight:600, color:"#071945", marginBottom:4, display:"block" },
    input: { width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #B8CFE0", fontSize:14, color:"#071945", background:"#F5FAFC", outline:"none", boxSizing:"border-box" },
    btn: { padding:"10px 20px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s" },
    btnPrimary: { background:"#0032FF", color:"#fff" },
    btnSecondary: { background:"#EAF3F6", color:"#071945", border:"1px solid #B8CFE0" },
    btnSm: { padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid #B8CFE0", background:"#fff", color:"#071945" },
    steps: { display:"flex", gap:8, marginBottom:28 },
  };

  const Step = ({ n, label, active, done }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, opacity: done||active ? 1 : 0.4 }}>
      <div style={{ width:24, height:24, borderRadius:"50%", background: done ? "#21CBA6" : active ? "#0032FF" : "#B8CFE0", color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {done ? "✓" : n}
      </div>
      <span style={{ fontSize:12, fontWeight:600, color: active ? "#0032FF" : done ? "#21CBA6" : "#4A6B8A" }}>{label}</span>
      {n < 4 && <span style={{ color:"#B8CFE0", fontSize:14, marginLeft:2 }}>›</span>}
    </div>
  );

  // ── WELCOME ──
  if (step === "welcome") return (
    <div style={S.app}>
      <div style={S.header}><div style={S.logo}>SkillMapper</div><div style={S.tag}>HR Function · MVP</div></div>
      <div style={S.main}>
        <div style={{ ...S.card, textAlign:"center", padding:"48px 32px", background:"#071945", border:"none" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⬡</div>
          <div style={{ ...S.h1, color:"#fff" }}>Map your HR skills</div>
          <p style={{ fontSize:14, color:"#93B8D4", maxWidth:480, margin:"0 auto 32px", lineHeight:1.6 }}>
            Understand where you stand across 6 competency areas, identify your gaps, and get a personalised learning roadmap.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button style={{ ...S.btn, background:"#0032FF", color:"#fff" }} onClick={() => setStep("profile")}>Start new profile</button>
            {resumeId && (
              <button style={{ ...S.btn, background:"rgba(255,255,255,0.12)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)" }} onClick={resumeSession} disabled={saving}>
                {saving ? "Loading…" : `Resume · ${resumeId}`}
              </button>
            )}
          </div>
          {!dbReady && <p style={{ fontSize:11, color:"#FF5D00", marginTop:20 }}>⚠ Demo mode — Supabase not configured.</p>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[["Select your role","Pick your HR function and seniority — skills load automatically","#0032FF"],
            ["Self-assess your skills","Rate yourself honestly across all skills in your role","#21CBA6"],
            ["See your gaps & insights","Visualise gaps vs benchmark and get an AI-generated snapshot","#500B71"],
            ["Get learning resources","Courses matched to your top gaps and target proficiency level","#FF5D00"]
          ].map(([t,d,accent],i) => (
            <div key={i} style={{ ...S.card, padding:20, marginBottom:0, borderTop:`3px solid ${accent}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:accent, marginBottom:6 }}>Step {i+1}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#071945", marginBottom:4 }}>{t}</div>
              <div style={{ fontSize:12, color:"#4A6B8A", lineHeight:1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PROFILE ──
  if (step === "profile") return (
    <div style={S.app}>
      <div style={S.header}><div style={S.logo}>SkillMapper</div></div>
      <div style={S.main}>
        <div style={S.steps}>
          <Step n={1} label="Profile" active={true} /><Step n={2} label="Skills" /><Step n={3} label="Chart" /><Step n={4} label="Learning" />
        </div>
        <div style={S.card}>
          <div style={S.h2}>Your profile</div>
          <p style={S.sub}>Select your HR function — we'll load the matching skill taxonomy automatically.</p>
          <label style={S.label}>HR Function *</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => handleRoleSelect(r)}
                disabled={taxonomyLoading}
                style={{ padding:"12px 8px", borderRadius:10, border:`2px solid ${profile.role_title===r?"#0032FF":"#D6E4F0"}`, background: profile.role_title===r?"#0032FF":"#fff", color: profile.role_title===r?"#fff":"#071945", fontSize:13, fontWeight:600, cursor:taxonomyLoading?"wait":"pointer", transition:"all 0.15s", opacity:taxonomyLoading?0.5:1 }}>
                {r}
              </button>
            ))}
            {taxonomyLoading && <div style={{ gridColumn:"1/-1", textAlign:"center", fontSize:12, color:"#4A6B8A", padding:"8px 0" }}>Loading taxonomy…</div>}
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Role level (optional)</label>
            <div style={{ display:"flex", gap:8 }}>
              {["Junior","Mid-level","Senior"].map(l => (
                <button key={l} onClick={() => {
                  const newLevel = profile.role_level === l ? "" : l;
                  setProfile(p => ({...p, role_level: newLevel}));
                  if (profile.role_title) setSkills(buildSkills(profile.role_title, newLevel, taxonomy));
                }}
                  style={{ flex:1, padding:"9px 8px", borderRadius:8, border:`2px solid ${profile.role_level===l?"#0032FF":"#D6E4F0"}`, background:profile.role_level===l?"#0032FF":"#fff", color:profile.role_level===l?"#fff":"#071945", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Career goals (optional)</label>
            <textarea value={profile.career_goals} onChange={e=>setProfile(p=>({...p,career_goals:e.target.value}))} style={{ ...S.input, minHeight:72, resize:"vertical" }} placeholder="e.g. Move into a Head of People Analytics role in 2 years" />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={S.label}>Manager feedback themes (optional)</label>
            <textarea value={profile.manager_feedback} onChange={e=>setProfile(p=>({...p,manager_feedback:e.target.value}))} style={{ ...S.input, minHeight:72, resize:"vertical" }} placeholder="e.g. Strong on stakeholder management; needs to develop deeper technical skills" />
          </div>
          <button style={{ ...S.btn, ...S.btnPrimary, opacity: profile.role_title ? 1 : 0.5 }}
            onClick={() => saveProfile(profile.role_title, profile.role_level)} disabled={!profile.role_title || saving}>
            {saving ? "Saving…" : "Continue to skills →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── SKILLS ──
  if (step === "skills" || step === "assess") return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>SkillMapper</div>
        {anonId && <div style={{ fontSize:11, color:"#9CA3AF" }}>ID: <strong style={{color:"#4F46E5"}}>{anonId}</strong></div>}
      </div>
      <div style={S.main}>
        <div style={S.steps}>
          <Step n={1} label="Profile" done /><Step n={2} label="Skills" active /><Step n={3} label="Chart" /><Step n={4} label="Learning" />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setStep("profile")} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:13, padding:0, display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>← Profile</button>
            <div style={{ width:1, height:16, background:"#E5E7EB" }} />
            <div>
              <div style={S.h2}>{profile.role_title} · Skill profile</div>
              <div style={{ fontSize:13, color:"#6B7280" }}>{skills.length} skills across {grouped.length} competencies · {assessed} rated</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...S.btnSm, background:"#0032FF", color:"#fff", border:"none" }} onClick={() => setShowAddForm(v=>!v)}>+ Add skill</button>
            <button style={{ ...S.btn, ...S.btnPrimary, padding:"6px 16px", fontSize:13 }} onClick={() => setStep("chart")}>View chart →</button>
          </div>
        </div>

        {/* Proficiency legend */}
        <div style={{ background:"#EAF3F6", border:"1px solid #B8CFE0", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#071945", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Proficiency scale — rate each skill below</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6 }}>
            {[
              [1,"Awareness","Knows it exists; can recognise it","#4A6B8A","#fff","#B8CFE0"],
              [2,"Foundation","Basic understanding; needs guidance","#071C77","#E6EBFF","#071C77"],
              [3,"Practitioner","Applies independently","#0032FF","#0032FF","#0032FF"],
              [4,"Advanced","Deep expertise; coaches others","#500B71","#F0E8F5","#500B71"],
              [5,"Expert","Sets the standard for the org","#fff","#071945","#071945"],
            ].map(([n, label, desc, textColor, bg, border]) => (
              <div key={n} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:8, padding:"8px 10px", display:"flex", flexDirection:"column", gap:3 }}>
                <div style={{ fontSize:16, fontWeight:800, color: n===3?"#fff":n===5?"#fff":textColor, lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:11, fontWeight:700, color: n===3?"#fff":n===5?"#fff":textColor }}>{label}</div>
                <div style={{ fontSize:10, color: n===3?"rgba(255,255,255,0.8)":n===5?"rgba(255,255,255,0.7)":textColor, opacity:n===3||n===5?1:0.75, lineHeight:1.3 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", marginTop:8, gap:4 }}>
            <div style={{ fontSize:10, color:"#4A6B8A" }}>lower</div>
            <div style={{ flex:1, height:2, background:"linear-gradient(to right, #B8CFE0, #071C77, #0032FF, #500B71, #071945)", borderRadius:2 }} />
            <div style={{ fontSize:10, color:"#4A6B8A" }}>higher</div>
          </div>
        </div>

        {/* Add skill form */}
        {showAddForm && (
          <div style={{ ...S.card, border:"1px dashed #0032FF", background:"#E6EBFF", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#0032FF", marginBottom:12 }}>Add a custom skill</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <label style={S.label}>Competency</label>
                <select value={newSkill.competency_area} onChange={e=>setNewSkill(s=>({...s,competency_area:e.target.value}))} style={S.input}>
                  {COMPETENCIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Skill name</label>
                <input value={newSkill.skill_name} onChange={e=>setNewSkill(s=>({...s,skill_name:e.target.value}))} style={S.input} placeholder="e.g. Stakeholder mapping" />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>Notes (optional)</label>
              <input value={newSkill.notes} onChange={e=>setNewSkill(s=>({...s,notes:e.target.value}))} style={S.input} placeholder="Any context about this skill" />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...S.btn, ...S.btnPrimary, padding:"8px 16px", fontSize:13 }} onClick={addSkill}>Add skill</button>
              <button style={{ ...S.btn, ...S.btnSecondary, padding:"8px 16px", fontSize:13 }} onClick={()=>setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Skills by competency */}
        {skills.length === 0 ? (
          <div style={{ ...S.card, textAlign:"center", padding:"32px", color:"#4A6B8A" }}>
            {taxonomyLoading ? "Loading skills…" : "Select a role on the profile page to load skills."}
          </div>
        ) : grouped.map(({ comp, skills: compSkills }) => {
          const cc = COMP_COLORS[comp];
          const compAssessed = compSkills.filter(s=>s.self_assessed_level!=null).length;
          return (
            <div key={comp} style={{ ...S.card, marginBottom:12, borderLeft:`4px solid ${cc.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:cc.dot }} />
                  <div style={{ fontSize:14, fontWeight:700, color:"#071945" }}>{comp}</div>
                </div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>{compAssessed}/{compSkills.length} rated</div>
              </div>
              {compSkills.map(sk => (
                <SkillRow key={sk.skill_name+sk.competency_area} skill={sk} onUpdate={updateSkill} onRemove={removeSkill} />
              ))}
            </div>
          );
        })}

        {assessed > 0 && (
          <div style={{ position:"sticky", bottom:20, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
            <div style={{ display:"flex", gap:10, background:"#071945", borderRadius:16, padding:"10px 16px", boxShadow:"0 4px 24px rgba(7,25,69,0.25)", pointerEvents:"all" }}>
              <div style={{ fontSize:12, color:"#93B8D4", alignSelf:"center" }}>{assessed}/{skills.length} skills rated</div>
              <button style={{ ...S.btn, background:"#0032FF", color:"#fff", padding:"8px 20px", fontSize:13 }}
                onClick={() => { saveSkills(); setStep("chart"); }}>View my skill chart →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── CHART ──
  if (step === "chart") return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>SkillMapper</div>
        {anonId && <div style={{ fontSize:11, color:"#9CA3AF" }}>ID: <strong style={{color:"#4F46E5"}}>{anonId}</strong></div>}
      </div>
      <div style={S.main}>
        <div style={S.steps}>
          <Step n={1} label="Profile" done /><Step n={2} label="Skills" done /><Step n={3} label="Chart" active /><Step n={4} label="Learning" />
        </div>

        <div style={{ ...S.card, marginBottom:16, background:"#071945", border:"none" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#21CBA6", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Your skill snapshot</div>
              {insightLoading && <div style={{ fontSize:13, color:"#93B8D4", fontStyle:"italic" }}>Generating insight…</div>}
              {!insightLoading && insight && <div style={{ fontSize:14, color:"#EAF3F6", lineHeight:1.7 }}>{insight}</div>}
              {!insightLoading && !insight && <div style={{ fontSize:13, color:"#4A6B8A" }}>{skills.some(s => s.self_assessed_level != null) ? "Click to generate a personalised insight based on your gaps." : "Complete your self-assessment first, then generate an insight."}</div>}
            </div>
            <button onClick={generateInsight} disabled={insightLoading || !skills.some(s=>s.self_assessed_level!=null)}
              style={{ ...S.btn, background:"#0032FF", color:"#fff", padding:"8px 14px", fontSize:12, flexShrink:0, opacity: skills.some(s=>s.self_assessed_level!=null) ? 1 : 0.4 }}>
              {insightLoading ? "…" : insight ? "Refresh" : "Generate insight"}
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div style={{ ...S.card, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>Competency overview</div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:8 }}>Click a dimension to drill in →</div>
            <SpiderChart skills={skills} activeComp={activeComp} onCompClick={(c) => setActiveComp(a => a===c ? null : c)} />
          </div>
          <div style={{ ...S.card, padding:16 }}>
            {!activeComp ? (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>All competencies</div>
                <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:12 }}>Click a competency to see skill detail →</div>
                <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                  {[["#A8EBD8","#0F8A6E","Strong"],["#FFD8B0","#CC4A00","Developing"],["#FFBDAA","#CC0000","Lacking"],["#D6E4F0","#4A6B8A","Not rated"]].map(([bg,text,label]) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:bg, border:`1px solid ${text}33` }} />
                      <span style={{ fontSize:10, color:"#6B7280" }}>{label}</span>
                    </div>
                  ))}
                </div>
                {COMPETENCIES.map(c => {
                  const all = skills.filter(s => s.competency_area===c);
                  const rated = all.filter(s => s.self_assessed_level!=null);
                  const strong = rated.filter(s => s.required_level - s.self_assessed_level <= 0);
                  const developing = rated.filter(s => s.required_level - s.self_assessed_level === 1);
                  const lacking = rated.filter(s => s.required_level - s.self_assessed_level > 1);
                  const unrated = all.filter(s => s.self_assessed_level==null);
                  const cc = COMP_COLORS[c];
                  const overallStatus = rated.length === 0 ? "not rated" : lacking.length > 0 ? "needs work" : developing.length > 0 ? "developing" : "strong";
                  const statusColor = overallStatus==="strong"?"#0F8A6E":overallStatus==="developing"?"#CC4A00":overallStatus==="needs work"?"#CC0000":"#4A6B8A";
                  return (
                    <div key={c} onClick={() => setActiveComp(c)}
                      style={{ marginBottom:8, cursor:"pointer", padding:"10px 12px", borderRadius:10, border:"1px solid transparent", transition:"all 0.15s", background:"#FAFCFE" }}
                      onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${cc.border}`; e.currentTarget.style.background="#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.border="1px solid transparent"; e.currentTarget.style.background="#FAFCFE"; }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#071945", display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:cc.dot, display:"inline-block", flexShrink:0 }} />{c}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:overallStatus==="strong"?"#E0F8F3":overallStatus==="developing"?"#FFF0E8":overallStatus==="needs work"?"#FFE8E8":"#EAF3F6", padding:"2px 8px", borderRadius:10 }}>{overallStatus}</span>
                      </div>
                      <div style={{ display:"flex", gap:12, marginTop:5, flexWrap:"wrap" }}>
                        {rated.length === 0 ? <span style={{ fontSize:11, color:"#4A6B8A", fontStyle:"italic" }}>Not yet rated — click to assess</span> : <>
                          {strong.length > 0 && <span style={{ fontSize:11, color:"#0F8A6E", fontWeight:600 }}>{strong.length}/{all.length} meet</span>}
                          {developing.length > 0 && <span style={{ fontSize:11, color:"#CC4A00", fontWeight:600 }}>{developing.length}/{all.length} developing</span>}
                          {lacking.length > 0 && <span style={{ fontSize:11, color:"#CC0000", fontWeight:600 }}>{lacking.length}/{all.length} lacking</span>}
                          {unrated.length > 0 && <span style={{ fontSize:11, color:"#4A6B8A" }}>{unrated.length} not rated</span>}
                        </>}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <button onClick={() => setActiveComp(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4A6B8A", fontSize:18, padding:0, lineHeight:1 }}>←</button>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:COMP_COLORS[activeComp].dot }} />
                    <div style={{ fontSize:13, fontWeight:700, color:"#071945" }}>{activeComp}</div>
                  </div>
                </div>
                <CompetencySpider skills={skills.filter(s => s.competency_area === activeComp)} color={COMP_COLORS[activeComp]} />
                <div style={{ marginTop:8 }}>
                  {skills.filter(s => s.competency_area===activeComp).map(sk => {
                    const gap = sk.self_assessed_level != null ? sk.required_level - sk.self_assessed_level : null;
                    const status = gap === null ? null : gap > 2 ? "needs work" : gap > 0 ? "developing" : gap === 0 ? "on track" : "exceeds";
                    const statusColor = gap === null ? "#4A6B8A" : gap > 2 ? "#CC0000" : gap > 0 ? "#CC4A00" : "#0F8A6E";
                    const statusBg = gap === null ? "#EAF3F6" : gap > 2 ? "#FFE8E8" : gap > 0 ? "#FFF0E8" : "#E0F8F3";
                    return (
                      <div key={sk.skill_name} style={{ padding:"8px 0", borderBottom:"1px solid #EAF3F6" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#071945" }}>{sk.skill_name}</div>
                          {status && <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:statusBg, padding:"2px 8px", borderRadius:10 }}>{status}</span>}
                        </div>
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          {[1,2,3,4,5].map(lvl => {
                            const isSelf = sk.self_assessed_level === lvl;
                            const isReq = sk.required_level === lvl;
                            const belowSelf = sk.self_assessed_level && lvl <= sk.self_assessed_level;
                            const inGap = sk.self_assessed_level && lvl > sk.self_assessed_level && lvl <= sk.required_level;
                            const aboveReq = sk.self_assessed_level && lvl <= sk.self_assessed_level && lvl > sk.required_level;
                            const bg = !sk.self_assessed_level ? (lvl <= sk.required_level ? "#B8CFE0" : "#EAF3F6") : inGap ? "#FFBDAA" : aboveReq ? "#A8EBD8" : belowSelf ? "#99B8FF" : "#EAF3F6";
                            return (
                              <div key={lvl} style={{ position:"relative", flex:1 }}>
                                <div style={{ height:8, borderRadius:4, background:bg, outline: isSelf ? "2px solid #0032FF" : isReq ? "2px solid #071945" : "none", outlineOffset:1, transition:"background 0.3s" }} />
                                {(isSelf || isReq) && <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", fontSize:8, fontWeight:700, color: isSelf ? "#0032FF" : "#071945", whiteSpace:"nowrap" }}>{isSelf && isReq ? "you / req" : isSelf ? "you" : "req"}</div>}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#B8CFE0", marginTop:18 }}>
                          {["Awareness","Foundation","Practitioner","Advanced","Expert"].map(l => <span key={l} style={{ flex:1, textAlign:"center" }}>{l}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Top priority gaps</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:16 }}>Skills where your current level is furthest from what's required</div>
          {skills.filter(s=>s.self_assessed_level!=null&&s.required_level-s.self_assessed_level>0)
            .sort((a,b)=>(b.required_level-b.self_assessed_level)-(a.required_level-a.self_assessed_level))
            .slice(0,8).map(sk => {
              const gap = sk.required_level - sk.self_assessed_level;
              const cc = COMP_COLORS[sk.competency_area];
              const statusColor = gap > 2 ? "#CC0000" : "#CC4A00";
              const statusBg = gap > 2 ? "#FFE8E8" : "#FFF0E8";
              return (
                <div key={sk.skill_name+sk.competency_area} style={{ padding:"10px 0", borderBottom:"1px solid #EAF3F6" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:cc.dot, flexShrink:0 }} />
                        <span style={{ fontSize:13, fontWeight:600, color:"#071945" }}>{sk.skill_name}</span>
                      </div>
                      <div style={{ fontSize:11, color:"#4A6B8A", marginLeft:12 }}>{sk.competency_area}</div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:statusBg, padding:"2px 8px", borderRadius:10, flexShrink:0 }}>{gap > 2 ? "needs work" : "developing"}</span>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    {[1,2,3,4,5].map(lvl => {
                      const isSelf = sk.self_assessed_level === lvl;
                      const isReq = sk.required_level === lvl;
                      const belowSelf = lvl <= sk.self_assessed_level;
                      const inGap = lvl > sk.self_assessed_level && lvl <= sk.required_level;
                      const bg = inGap ? "#FFBDAA" : belowSelf ? "#99B8FF" : "#EAF3F6";
                      return (
                        <div key={lvl} style={{ position:"relative", flex:1 }}>
                          <div style={{ height:10, borderRadius:4, background:bg, outline: isSelf ? "2px solid #0032FF" : isReq ? "2px solid #071945" : "none", outlineOffset:1 }} />
                          {(isSelf || isReq) && <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", fontSize:9, fontWeight:700, color: isSelf ? "#0032FF" : "#071945", whiteSpace:"nowrap" }}>{isSelf && isReq ? "you / req" : isSelf ? `you · ${LEVEL_LABELS[lvl]}` : `req · ${LEVEL_LABELS[lvl]}`}</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop:28 }} />
                </div>
              );
            })}
          {!skills.some(s=>s.self_assessed_level!=null) && <div style={{ color:"#9CA3AF", fontSize:13, textAlign:"center", padding:"20px 0" }}>Go back and self-assess your skills to see gaps here.</div>}
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => setStep("skills")}>← Back to skills</button>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setStep("learning")}>View learning recommendations →</button>
        </div>
      </div>
    </div>
  );

  // ── LEARNING ──
  if (step === "learning") {
    const topGaps = skills
      .filter(s => s.self_assessed_level != null && s.required_level - s.self_assessed_level > 0)
      .sort((a, b) => (b.required_level - b.self_assessed_level) - (a.required_level - a.self_assessed_level))
      .slice(0, 5);
    return (
      <div style={S.app}>
        <div style={S.header}>
          <div style={S.logo}>SkillMapper</div>
          {anonId && <div style={{ fontSize:11, color:"#9CA3AF" }}>ID: <strong style={{color:"#4F46E5"}}>{anonId}</strong></div>}
        </div>
        <div style={S.main}>
          <div style={S.steps}>
            <Step n={1} label="Profile" done /><Step n={2} label="Skills" done /><Step n={3} label="Chart" done /><Step n={4} label="Learning" active />
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ ...S.h1, marginBottom:6 }}>Your learning roadmap</div>
            <div style={S.sub}>Courses matched to your top {topGaps.length} priority gaps — filtered by the level you need to reach.</div>
          </div>
          {topGaps.length === 0 ? (
            <div style={{ ...S.card, textAlign:"center", padding:"48px 32px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#071945", marginBottom:8 }}>No gaps to address!</div>
              <div style={{ fontSize:14, color:"#4A6B8A" }}>You're meeting or exceeding requirements across all rated skills.</div>
            </div>
          ) : topGaps.map((sk, idx) => {
            const gap = sk.required_level - sk.self_assessed_level;
            const targetLevel = sk.required_level;
            const courseLevels = targetLevel <= 2 ? ['beginner'] : targetLevel === 3 ? ['beginner','intermediate'] : ['intermediate','advanced','all'];
            const cc = COMP_COLORS[sk.competency_area];
            const statusColor = gap > 1 ? "#CC0000" : "#CC4A00";
            const statusBg = gap > 1 ? "#FFE8E8" : "#FFF0E8";
            const statusLabel = gap > 1 ? "needs work" : "developing";
            return <GapCourses key={sk.skill_name+sk.competency_area} skill={sk} idx={idx} gap={gap} courseLevels={courseLevels} cc={cc} statusColor={statusColor} statusBg={statusBg} statusLabel={statusLabel} />;
          })}
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:8 }}>
            <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => setStep("chart")}>← Back to chart</button>
          </div>
        </div>
      </div>
    );
  }
}