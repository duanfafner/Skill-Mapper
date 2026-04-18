import { useState, useEffect, useRef, useCallback } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Paste your Supabase URL and anon key here
const SUPABASE_URL = "https://sfusgwchqenjbbfrvptz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdXNnd2NocWVuamJiZnJ2cHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjQyMzEsImV4cCI6MjA5MjAwMDIzMX0.I4ztMYHfLsIz4t9ZLwHJU5bv9Mm_pr00VCbJohqQHPg";

// ── SUPABASE CLIENT (no SDK needed — raw fetch) ───────────────────────────────
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

// ── TAXONOMY SEED DATA ────────────────────────────────────────────────────────
const TAXONOMY = [
  ["HR Domain Depth","HRBP","Employee relations",3,"Managing complex escalations, grievances and sensitive workplace matters."],
  ["HR Domain Depth","HRBP","HR Domain knowledge",5,"Deep expertise in employment law, org design, and strategic HR advising."],
  ["HR Domain Depth","HRBP","HR processes",4,"Understanding HR processes around onboarding, offboarding, performance, merit and promotion cycles."],
  ["HR Domain Depth","HRBP","Org design",4,"Advising on spans, layers and role design to improve business alignment."],
  ["HR Domain Depth","HRBP","Talent management",4,"Running calibrations, succession planning and career pathing with leaders."],
  ["HR Domain Depth","Learning & Dev","Learning Strategy",5,"Owning the org's approach to learning aligned to business priorities."],
  ["HR Domain Depth","Learning & Dev","Curriculum design",4,"Building programme architectures and scalable leadership journeys."],
  ["HR Domain Depth","Learning & Dev","Facilitation & Training",4,"Designing and delivering engaging learning across multiple formats."],
  ["HR Domain Depth","Learning & Dev","Talent management",3,"Building development infrastructure that supports the talent pipeline."],
  ["HR Domain Depth","HR Ops","HR Domain knowledge",4,"Broad knowledge of payroll, benefits and compliance to resolve employee queries."],
  ["HR Domain Depth","HR Ops","Process & workflow SOP",5,"Executing and auditing transactional workflows with strict SLA adherence."],
  ["HR Domain Depth","HR Ops","System knowledge",4,"End-user navigation, record management and HRIS troubleshooting."],
  ["HR Domain Depth","HR Ops","HR processes",5,"Standardising onboarding, offboarding and leave workflows compliantly."],
  ["HR Domain Depth","HR Systems","HR processes",4,"Configuring HRIS approval routing and rules to automate HR workflows."],
  ["HR Domain Depth","HR Systems","HR Domain knowledge",4,"Understanding comp, talent cycles and org hierarchies to build accurate system logic."],
  ["HR Domain Depth","HR Systems","System knowledge",5,"Advanced tenant configuration, API management and release testing."],
  ["HR Domain Depth","People Analytics","Workforce planning",4,"Modelling headcount scenarios and analysing attrition to inform hiring plans."],
  ["HR Domain Depth","People Analytics","Talent management",3,"Understanding talent processes and providing analysis that supports performance cycles."],
  ["HR Domain Depth","People Analytics","System knowledge",4,"Managing data lakes, ETL pipelines and HRIS systems to support analytical workflows."],
  ["HR Domain Depth","People Analytics","HR processes",4,"Understanding all HR processes and mapping process data to analyse cycle times and identify bottlenecks."],
  ["HR Domain Depth","People Analytics","HR Domain knowledge",4,"Deep enough HR knowledge to frame the right analytical questions."],
  ["HR Domain Depth","Recruiting","Recruiting strategy",5,"Designing end-to-end talent acquisition approach aligned to business growth."],
  ["HR Domain Depth","Recruiting","Talent market knowledge",5,"Deep understanding of talent landscape, competitor hiring and comp benchmarks."],
  ["HR Domain Depth","Recruiting","Interview design",4,"Building structured, bias-reducing interview frameworks that predict performance."],
  ["HR Domain Depth","Recruiting","HR processes",3,"Managing ATS workflows, pipeline stages and offer approvals."],
  ["Technical Fluency","HRBP","System Operations",3,"Basic HRIS navigation to access data, run reports and complete transactions."],
  ["Technical Fluency","HRBP","Operational rigor",3,"Maintaining accurate records and following through on commitments consistently."],
  ["Technical Fluency","Learning & Dev","System Operations",5,"Managing LMS admin, SCORM hosting and completion tracking at scale."],
  ["Technical Fluency","Learning & Dev","Content authoring tools",4,"Using authoring platforms (Articulate, Rise) to build digital learning content."],
  ["Technical Fluency","Learning & Dev","Knowledge Management",3,"Organising learning resources so the right content reaches the right people."],
  ["Technical Fluency","HR Ops","Operational rigor",5,"Relentless focus on data accuracy, queue management and SOP improvement."],
  ["Technical Fluency","HR Ops","Process design",3,"Mapping workflows and redesigning transactional processes for speed and compliance."],
  ["Technical Fluency","HR Ops","System Operations",5,"Managing high-volume case logging, routing and resolution in case management systems."],
  ["Technical Fluency","HR Ops","Workflow automation",4,"Implementing automations (approvals, notifications, syncs) to reduce manual effort."],
  ["Technical Fluency","HR Systems","Process design",4,"Translating HR requirements into system config — approval chains, rules, access."],
  ["Technical Fluency","HR Systems","System thinking",5,"Understanding how HRIS changes cascade across modules, integrations and reports."],
  ["Technical Fluency","HR Systems","Operational rigor",5,"Maintaining system integrity through rigorous change management and release testing."],
  ["Technical Fluency","HR Systems","Integration",4,"Managing API integrations and data sync between HRIS and adjacent systems."],
  ["Technical Fluency","HR Systems","HRIS configuration",5,"Deep expertise in configuring HRIS modules, security roles and dashboards."],
  ["Technical Fluency","People Analytics","System thinking",5,"Understanding how HR data flows and how architecture decisions affect data quality."],
  ["Technical Fluency","People Analytics","Data infrastructure and modeling",5,"Building people data pipelines and dimensional models that power analytics."],
  ["Technical Fluency","People Analytics","Operational rigor",5,"Ensuring reproducible workflows and strict data privacy standards in all analysis."],
  ["Technical Fluency","People Analytics","Data visualization and insights",5,"Translating analytical outputs into compelling visual narratives using BI tools."],
  ["Technical Fluency","People Analytics","Research & statistics methods",4,"Applying statistical techniques (regression, survival analysis) to people data questions."],
  ["Technical Fluency","Recruiting","System Operations",5,"Managing the ATS end-to-end — posting, pipeline config, comms and reporting."],
  ["Technical Fluency","Recruiting","Operational rigor",5,"Maintaining clean candidate data and consistent structured interview adherence."],
  ["Ownership & PM","HRBP","Ownership",5,"End-to-end accountability for HR projects within client groups, minimal direction needed."],
  ["Ownership & PM","HRBP","Execution & Delivery",3,"Managing timelines across priorities and delivering outputs on time."],
  ["Ownership & PM","HRBP","Change management",4,"Designing stakeholder comms and resistance management for org changes."],
  ["Ownership & PM","Learning & Dev","Ownership",5,"Full programme accountability — scoping, vendor management, budget and learner experience."],
  ["Ownership & PM","Learning & Dev","Vendor management",4,"Sourcing and performance-managing learning vendors to deliver quality programmes."],
  ["Ownership & PM","Learning & Dev","Change management",4,"Driving adoption of new programmes by building manager advocacy and engagement."],
  ["Ownership & PM","Learning & Dev","Budget management",3,"Tracking L&D spend and making trade-off decisions to maximise learning impact."],
  ["Ownership & PM","HR Ops","Ownership",5,"Owning HR processes end-to-end — quality, compliance and SLA performance."],
  ["Ownership & PM","HR Ops","SLA management",4,"Monitoring KPIs and implementing corrective actions when SLAs are at risk."],
  ["Ownership & PM","HR Ops","Change management",4,"Managing people and process transitions for system upgrades and policy changes."],
  ["Ownership & PM","HR Ops","Continuous improvement",5,"Identifying inefficiencies and implementing sustainable process improvements."],
  ["Ownership & PM","HR Systems","Ownership",5,"Product ownership of HR tech — roadmap, prioritisation and delivery end-to-end."],
  ["Ownership & PM","HR Systems","Continuous improvement",5,"Evaluating platform releases and proactively upgrading system capabilities."],
  ["Ownership & PM","HR Systems","Execution & Delivery",4,"Managing HRIS project timelines, testing cycles and go-live readiness."],
  ["Ownership & PM","HR Systems","Vendor management",3,"Managing HRIS vendor relationships, SLAs and product roadmap discussions."],
  ["Ownership & PM","People Analytics","Ownership",5,"Owning the full analytics lifecycle — from question framing through insight delivery."],
  ["Ownership & PM","People Analytics","Execution & Delivery",4,"Scoping projects clearly and delivering insights on schedule with appropriate caveats."],
  ["Ownership & PM","People Analytics","Continuous improvement",4,"Iterating on models and data products based on stakeholder feedback."],
  ["Ownership & PM","Recruiting","Ownership",5,"Full accountability for req management, pipeline health and candidate experience."],
  ["Ownership & PM","Recruiting","Capacity planning",4,"Forecasting hiring volumes and flagging recruiter capacity constraints proactively."],
  ["Ownership & PM","Recruiting","Budget management",4,"Tracking recruiting spend and optimising channel mix for cost-per-hire efficiency."],
  ["Strategic Leadership","HRBP","Business acumen",5,"Deep understanding of your client group's business model to shape people strategy."],
  ["Strategic Leadership","HRBP","Cross-function collaboration",4,"Building trusted relationships across HR COEs, Finance and Legal to deliver joined-up programmes."],
  ["Strategic Leadership","HRBP","Org diagnosis",5,"Assessing org health and recommending evidence-based interventions to leaders."],
  ["Strategic Leadership","HRBP","Strategic partnering",4,"Bringing people insights to business planning cycles as a thought partner, not a service provider."],
  ["Strategic Leadership","HRBP","Change leadership",4,"Leading the human side of transformation — coaching leaders and sustaining momentum."],
  ["Strategic Leadership","Learning & Dev","L&D strategy",4,"Translating capability needs into a multi-year L&D strategy with measurable outcomes."],
  ["Strategic Leadership","Learning & Dev","Business acumen",4,"Understanding how the business makes money to target learning where it matters most."],
  ["Strategic Leadership","Learning & Dev","Skills gap analysis",3,"Conducting needs assessments to identify capability gaps at role or org level."],
  ["Strategic Leadership","Learning & Dev","Culture & engagement",3,"Designing learning that reinforces cultural behaviours and builds belonging."],
  ["Strategic Leadership","HR Ops","Process innovation",3,"Rethinking HR service delivery using technology or new operating models."],
  ["Strategic Leadership","HR Ops","HR strategy basics",3,"Understanding enough HR strategy to align operational priorities accordingly."],
  ["Strategic Leadership","HR Ops","Business acumen",2,"Basic awareness of how the business operates to shape Ops decisions."],
  ["Strategic Leadership","HR Systems","HR tech strategy",4,"Building the technology roadmap and sequencing implementations for the HR function."],
  ["Strategic Leadership","HR Systems","Business acumen",4,"Understanding business workflows to configure systems that reflect how work gets done."],
  ["Strategic Leadership","HR Systems","Vendor evaluation",3,"Running RFPs and scoring vendors against technical, commercial and strategic fit."],
  ["Strategic Leadership","HR Systems","Digital transformation",3,"Contributing to HR's digital transformation — driving self-service adoption and digital literacy."],
  ["Strategic Leadership","People Analytics","Automation and innovation",5,"Identifying where AI/ML can replace manual processes and leading implementation."],
  ["Strategic Leadership","People Analytics","Business acumen",4,"Framing analytics projects around strategic decisions, not just data availability."],
  ["Strategic Leadership","People Analytics","Research design",4,"Designing studies with appropriate controls and validity checks to ensure defensible outputs."],
  ["Strategic Leadership","People Analytics","People strategy input",4,"Synthesising findings into recommendations that influence talent strategy at senior level."],
  ["Strategic Leadership","Recruiting","Talent strategy",4,"Shaping the org's talent acquisition approach aligned to 12–24 month business plans."],
  ["Strategic Leadership","Recruiting","Employer branding",4,"Developing the EVP and careers presence that differentiates the org in the talent market."],
  ["Strategic Leadership","Recruiting","Workforce planning",3,"Translating business growth plans into hiring forecasts with HRBPs and Finance."],
  ["Strategic Leadership","Recruiting","DEI in hiring",3,"Embedding inclusive hiring practices and tracking representation across the funnel."],
  ["Stakeholder Management","HRBP","Business partnering",5,"Strategic relationships with senior leaders who see you as a thought partner, not a service provider."],
  ["Stakeholder Management","HRBP","Cross-team collaboration",5,"Working across HR COEs to deliver integrated people solutions for client groups."],
  ["Stakeholder Management","HRBP","Influencing without authority",5,"Shaping people decisions through evidence and credibility rather than positional power."],
  ["Stakeholder Management","HRBP","Executive engagement",4,"Communicating confidently at C-suite and VP level with tailored, credible messaging."],
  ["Stakeholder Management","Learning & Dev","Business partnering",4,"Engaging leaders to diagnose learning needs and position L&D as a strategic investment."],
  ["Stakeholder Management","Learning & Dev","Cross-team collaboration",4,"Co-designing programmes with HRBPs, HR Ops and vendors for operational feasibility."],
  ["Stakeholder Management","Learning & Dev","Influencing without authority",3,"Gaining manager support for learning time, investment and behaviour change."],
  ["Stakeholder Management","Learning & Dev","Consultation",3,"Using structured needs assessment to diagnose the real problem before recommending solutions."],
  ["Stakeholder Management","HR Ops","Cross-team collaboration",4,"Partnering with COEs, Finance and IT to deliver seamless employee experience."],
  ["Stakeholder Management","HR Ops","Influencing without authority",3,"Advocating for process improvements with teams outside HR Ops diplomatically."],
  ["Stakeholder Management","HR Ops","Executive engagement",2,"Preparing clear operational reports and escalation summaries for HR leadership."],
  ["Stakeholder Management","HR Ops","Consultation",3,"Acting as a knowledgeable first contact — diagnosing and routing employee queries."],
  ["Stakeholder Management","HR Systems","Cross-team collaboration",5,"Gathering requirements and managing dependencies across HR, IT and business units."],
  ["Stakeholder Management","HR Systems","Influencing without authority",4,"Getting stakeholders to prioritise HRIS projects and adopt new system features."],
  ["Stakeholder Management","HR Systems","Executive engagement",3,"Presenting system roadmaps and project status to senior leaders in plain language."],
  ["Stakeholder Management","HR Systems","Consultation",4,"Translating business requirements into system specs by surfacing unstated needs."],
  ["Stakeholder Management","People Analytics","Cross-team collaboration",5,"Embedding as a trusted analytical partner across HR COEs and business units."],
  ["Stakeholder Management","People Analytics","Influencing without authority",4,"Presenting counterintuitive findings and sustaining the conversation until insights drive action."],
  ["Stakeholder Management","People Analytics","Executive engagement",4,"Distilling complex analysis into crisp executive narratives with appropriate caveats."],
  ["Stakeholder Management","People Analytics","Consultation",4,"Reframing vague people questions into well-scoped analytical problems with clear success criteria."],
  ["Stakeholder Management","Recruiting","Cross-team collaboration",3,"Coordinating across hiring managers, panels, HR Ops and Comp to keep hiring moving."],
  ["Stakeholder Management","Recruiting","Business partnering",5,"Trusted advisor to hiring managers — bringing market insight and challenging unrealistic requirements."],
  ["Stakeholder Management","Recruiting","Executive engagement",4,"Presenting pipeline updates and market intelligence to senior leaders with clear recommendations."],
  ["Stakeholder Management","Recruiting","Agency management",4,"Briefing and holding agencies accountable to quality, diversity and delivery standards."],
  ["Data Literacy","HRBP","HR metrics",3,"Understanding key HR metrics, how they are calculated and defined, to inform leader conversations."],
  ["Data Literacy","HRBP","Data Interpretation",4,"Translating dashboard metrics into context and understanding metrics to have meaningful conversations with leaders."],
  ["Data Literacy","HRBP","Data Storytelling",4,"Framing people data in business language to land recommendations with leaders."],
  ["Data Literacy","HRBP","Reporting & Analysis",3,"Pulling HR reports to prepare business reviews and necessary analysis."],
  ["Data Literacy","HRBP","Data governance",3,"Handling sensitive employee data compliantly and following access protocols."],
  ["Data Literacy","HRBP","AI Literacy",2,"Knowing how to use GenAI to draft communications and summarise policies — with sound human judgment on outputs."],
  ["Data Literacy","Learning & Dev","HR metrics",4,"Tracking completion, satisfaction and downstream impact to evaluate programme effectiveness."],
  ["Data Literacy","Learning & Dev","Data Interpretation",4,"Interpreting learning analytics to identify engagement drop-off and curriculum gaps."],
  ["Data Literacy","Learning & Dev","Data Storytelling",4,"Presenting learning impact to stakeholders to build the case for L&D investment."],
  ["Data Literacy","Learning & Dev","Reporting & Analysis",3,"Building dashboards that track participation, completion and learner feedback."],
  ["Data Literacy","Learning & Dev","AI Literacy",2,"Using AI to accelerate content creation and personalise pathways — with critical judgment on outputs."],
  ["Data Literacy","HR Ops","HR metrics",3,"Monitoring SLA adherence, ticket volume and error rates to flag service quality issues."],
  ["Data Literacy","HR Ops","Data Interpretation",3,"Reading operational dashboards to understand workload patterns and data quality issues."],
  ["Data Literacy","HR Ops","Data Storytelling",3,"Summarising operational performance for HR leadership in regular service reviews."],
  ["Data Literacy","HR Ops","Reporting & Analysis",3,"Enforcing data entry standards and running audits to maintain a clean HRIS."],
  ["Data Literacy","HR Ops","AI Literacy",3,"Using AI to automate routine tasks (comms, query triage) and knowing when to escalate to a human."],
  ["Data Literacy","HR Systems","HR metrics",4,"Building configs and report structures that generate the metrics HR depends on accurately."],
  ["Data Literacy","HR Systems","Data Interpretation",3,"Reading system audit logs and error reports to diagnose configuration and data issues."],
  ["Data Literacy","HR Systems","Data Storytelling",3,"Presenting system health and adoption data to HR stakeholders in non-technical format."],
  ["Data Literacy","HR Systems","Reporting & Analysis",5,"Designing the reporting architecture — dashboards, calculated fields and scheduled outputs."],
  ["Data Literacy","HR Systems","Data governance",5,"Establishing validation rules and access permissions that prevent bad data entering the system."],
  ["Data Literacy","HR Systems","AI Literacy",4,"Evaluating AI modules, governing AI access in HRIS, and configuring AI-automated workflows."],
  ["Data Literacy","People Analytics","HR metrics",5,"Defining and governing the metrics the org uses to measure workforce health consistently."],
  ["Data Literacy","People Analytics","Data Interpretation",5,"Conducting advanced analysis (regression, survival) and interpreting findings for strategic narratives."],
  ["Data Literacy","People Analytics","Data Storytelling",5,"Translating sophisticated analysis into executive narratives that shift mindsets and drive action."],
  ["Data Literacy","People Analytics","Reporting & Analysis",5,"Building self-serve dashboards and data products that enable the broader HR function."],
  ["Data Literacy","People Analytics","Data governance",5,"Defining the data dictionary, standardising metric definitions and overseeing ethical use of predictive models."],
  ["Data Literacy","People Analytics","AI Literacy",4,"Applying LLMs to unstructured data, building analytical agents, and automating workflows and processes."],
  ["Data Literacy","Recruiting","HR metrics",4,"Tracking time-to-fill, source-of-hire and offer acceptance to optimise the hiring funnel."],
  ["Data Literacy","Recruiting","Data Interpretation",3,"Analysing funnel conversion and time-to-fill trends to identify sourcing bottlenecks."],
  ["Data Literacy","Recruiting","Data Storytelling",3,"Presenting recruiting performance and market insights to managers and senior leaders."],
  ["Data Literacy","Recruiting","Reporting & Analysis",3,"Building dashboards with real-time visibility into pipeline health and diversity metrics."],
  ["Data Literacy","Recruiting","Data governance",4,"Ensuring candidate data is handled compliantly and ATS records are accurate and complete."],
  ["Data Literacy","Recruiting","AI Literacy",2,"Using AI sourcing and screening tools — and actively mitigating algorithmic bias in candidate selection."],
];

const ROLES = ["HRBP","Learning & Dev","HR Ops","HR Systems","People Analytics","Recruiting"];
const COMPETENCIES = ["HR Domain Depth","Technical Fluency","Ownership & PM","Strategic Leadership","Stakeholder Management","Data Literacy"];
const BRAND = {
  wavBlue:  "#0032FF",
  deepBlue: "#071945",
  foamBlue: "#EAF3F6",
  aquaBlue: "#071C77",
  green:    "#21CBA6",
  orange:   "#FF5D00",
  purple:   "#500B71",
};

const COMP_COLORS = {
  "HR Domain Depth":        { bg: "#E6EBFF", border: "#0032FF", dot: "#071C77" },
  "Technical Fluency":      { bg: "#E0F8F3", border: "#21CBA6", dot: "#0F8A6E" },
  "Ownership & PM":         { bg: "#FFF0E8", border: "#FF5D00", dot: "#CC4A00" },
  "Strategic Leadership":   { bg: "#F0E8F5", border: "#500B71", dot: "#500B71" },
  "Stakeholder Management": { bg: "#E6EBFF", border: "#071C77", dot: "#0032FF" },
  "Data Literacy":          { bg: "#EAF3F6", border: "#071945", dot: "#071945" },
};
const LEVEL_LABELS = ["","Awareness","Foundation","Practitioner","Advanced","Expert"];

function genAnonId() {
  return "anon_" + Math.random().toString(36).slice(2, 8);
}

// ── COMPETENCY DRILL-DOWN SPIDER ─────────────────────────────────────────────
function CompetencySpider({ skills, color }) {
  if (!skills.length) return null;
  const N = skills.length;
  // Same canvas proportions as main SpiderChart
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

  // Word-wrap: split skill name into max 2 lines of ~11 chars
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
      {/* Grid rings */}
      {[1,2,3,4,5].map(ring => (
        <polygon key={ring}
          points={skills.map((_,i) => { const {x,y}=getCoord(i,ring); return `${x},${y}`; }).join(" ")}
          fill={ring%2===0?"rgba(0,0,0,0.02)":"none"} stroke="#E5E7EB" strokeWidth="0.8"
        />
      ))}
      {/* Axes */}
      {skills.map((_,i) => {
        const {x,y} = getCoord(i,5);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="0.8"/>;
      })}

      {/* Gap/surplus fill — per-axis coloring effect using clipped triangles from center */}
      {hasAny && skills.map((s, i) => {
        if (!s.self_assessed_level) return null;
        const gap = s.required_level - s.self_assessed_level;
        // Build a thin wedge between adjacent axes for this skill
        const prev = (i - 1 + N) % N;
        const next = (i + 1) % N;
        const pReq = getCoord(i, s.required_level);
        const pSelf = getCoord(i, s.self_assessed_level);
        // Mid-points toward neighbors at half distance
        const pReqMidPrev = { x: (cx + pReq.x) / 2, y: (cy + pReq.y) / 2 };
        const pReqMidNext = { x: (cx + pReq.x) / 2, y: (cy + pReq.y) / 2 };
        const pSelfMidPrev = { x: (cx + pSelf.x) / 2, y: (cy + pSelf.y) / 2 };
        const pSelfMidNext = { x: (cx + pSelf.x) / 2, y: (cy + pSelf.y) / 2 };
        if (gap > 0) {
          // Red: between self-assessed and required — area that needs improvement
          return (
            <polygon key={`gap-${i}`}
              points={`${cx},${cy} ${pSelf.x},${pSelf.y} ${pReq.x},${pReq.y}`}
              fill="rgba(239,68,68,0.15)" stroke="none" />
          );
        } else if (gap < 0) {
          // Green: self exceeds required — good
          const pAbove = getCoord(i, s.self_assessed_level);
          const pReqP = getCoord(i, s.required_level);
          return (
            <polygon key={`surplus-${i}`}
              points={`${cx},${cy} ${pReqP.x},${pReqP.y} ${pAbove.x},${pAbove.y}`}
              fill="rgba(16,185,129,0.18)" stroke="none" />
          );
        }
        return null;
      })}

      {/* Required polygon — deep blue dashed */}
      <polygon points={reqPoints}
        fill="rgba(7,25,69,0.05)" stroke="#071945" strokeWidth="2" strokeDasharray="5,3" />

      {/* Self-assessed polygon — wave blue */}
      {hasAny && (
        <polygon points={selfPoints}
          fill="rgba(0,50,255,0.10)" stroke="#0032FF" strokeWidth="2.5" />
      )}

      {/* Dots on required ring */}
      {skills.map((s, i) => {
        const {x,y} = getCoord(i, s.required_level);
        const gap = s.self_assessed_level != null ? s.required_level - s.self_assessed_level : 0;
        return <circle key={`rdot-${i}`} cx={x} cy={y} r={gap > 0 ? 4 : 3}
          fill={gap > 0 ? "#FF5D00" : "#071945"} opacity={0.9} />;
      })}

      {/* Dots on self-assessed ring */}
      {hasAny && skills.map((s, i) => {
        if (!s.self_assessed_level) return null;
        const {x,y} = getCoord(i, s.self_assessed_level);
        const gap = s.required_level - s.self_assessed_level;
        return <circle key={`sdot-${i}`} cx={x} cy={y} r={4}
          fill={gap > 0 ? "#0032FF" : "#21CBA6"} />;
      })}

      {/* Axis labels — 2-line word wrap, color-coded by gap */}
      {skills.map((s, i) => {
        const lp = getLabelCoord(i);
        const anchor = lp.x < cx - 8 ? "end" : lp.x > cx + 8 ? "start" : "middle";
        const gap = s.self_assessed_level != null ? s.required_level - s.self_assessed_level : null;
        const labelColor = gap === null ? "#9CA3AF" : gap > 1 ? "#DC2626" : gap > 0 ? "#D97706" : "#059669";
        const lines = wrapLabel(s.skill_name);
        const lineH = 12;
        const totalH = lines.length * lineH;
        const baseY = lp.y - totalH / 2 + lineH / 2;
        return (
          <g key={`label-${i}`}>
            {lines.map((line, li) => (
              <text key={li} x={lp.x} y={baseY + li * lineH}
                textAnchor={anchor} dominantBaseline="central"
                style={{ fontSize:9.5, fontFamily:"DM Sans, sans-serif", fill:labelColor, fontWeight:700 }}>
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Ring number labels */}
      {[1,2,3,4,5].map(r => (
        <text key={r} x={cx+4} y={getCoord(0,r).y+1}
          style={{ fontSize:7.5, fill:"#C4C4C4", fontFamily:"DM Sans, sans-serif" }}>{r}</text>
      ))}

      {/* Legend — matching main chart style */}
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
  // Large canvas with generous margin for labels
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
    // Push labels further out; top/bottom get extra Y room
    const dist = R + 52;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const avgByComp = (key) =>
    comps.map((c) => {
      const s = skills.filter((sk) => sk.competency_area === c && sk[key] != null);
      return s.length ? s.reduce((a, b) => a + b[key], 0) / s.length : 0;
    });

  const required = avgByComp("required_level");
  const assessed = avgByComp("self_assessed_level");

  const polyPoints = (vals) =>
    vals.map((v, i) => { const { x, y } = getCoord(i, v); return `${x},${y}`; }).join(" ");

  // Word-wrap helper: split label into max 2 lines of ~13 chars
  const wrapLabel = (text) => {
    if (text.length <= 13) return [text];
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= 13) { cur = (cur + " " + w).trim(); }
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", maxWidth: W }}>
      {/* Grid rings */}
      {[1,2,3,4,5].map(ring => (
        <polygon key={ring}
          points={comps.map((_, i) => { const {x,y} = getCoord(i, ring); return `${x},${y}`; }).join(" ")}
          fill={ring % 2 === 0 ? "rgba(0,0,0,0.02)" : "none"} stroke="#E5E7EB" strokeWidth="0.8"
        />
      ))}
      {/* Axes */}
      {comps.map((c, i) => {
        const { x, y } = getCoord(i, 5);
        const isActive = activeComp === c;
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={isActive ? "#4F46E5" : "#E5E7EB"} strokeWidth={isActive ? 1.5 : 0.8} />;
      })}
      {/* Required polygon — deep blue dashed */}
      <polygon points={polyPoints(required)} fill="rgba(7,25,69,0.05)" stroke="#071945" strokeWidth="1.5" strokeDasharray="5,3" />
      {/* Self-assessed polygon — wave blue */}
      {assessed.some(v => v > 0) && (
        <polygon points={polyPoints(assessed)} fill="rgba(0,50,255,0.10)" stroke="#0032FF" strokeWidth="2.5" />
      )}
      {/* Clickable axis dots + labels */}
      {comps.map((c, i) => {
        const lp = getLabelCoord(i);
        const dp = getCoord(i, 5);
        const isActive = activeComp === c;
        const anchor = lp.x < cx - 8 ? "end" : lp.x > cx + 8 ? "start" : "middle";
        const lines = wrapLabel(c);
        const lineH = 13;
        const totalH = lines.length * lineH;
        const baseY = lp.y - totalH / 2 + lineH / 2;
        const cc = COMP_COLORS[c];

        return (
          <g key={i} onClick={() => onCompClick(c)} style={{ cursor: "pointer" }}>
            {/* Clickable dot on axis tip */}
            <circle cx={dp.x} cy={dp.y} r={isActive ? 6 : 4}
              fill={isActive ? cc.dot : "#fff"} stroke={cc.dot} strokeWidth="1.5" />
            {/* Label background for active */}
            {isActive && (
              <rect x={anchor==="end" ? lp.x - 80 : anchor==="start" ? lp.x - 4 : lp.x - 42}
                y={baseY - lineH * 0.8} width={84} height={totalH + 8}
                rx={4} fill={cc.bg} opacity={0.9} />
            )}
            {/* Label lines */}
            {lines.map((line, li) => (
              <text key={li} x={lp.x} y={baseY + li * lineH}
                textAnchor={anchor} dominantBaseline="central"
                style={{ fontSize: 10, fontFamily: "DM Sans, sans-serif", fill: isActive ? cc.dot : "#374151", fontWeight: isActive ? 700 : 500 }}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
      {/* Ring number labels */}
      {[1,2,3,4,5].map(r => (
        <text key={r} x={cx + 4} y={getCoord(0, r).y + 1}
          style={{ fontSize: 7.5, fill: "#C4C4C4", fontFamily: "DM Sans, sans-serif" }}>{r}</text>
      ))}
      {/* Legend */}
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("welcome"); // welcome | profile | skills | assess | chart
  const [userId, setUserId] = useState(null);
  const [anonId, setAnonId] = useState("");
  const [profile, setProfile] = useState({ worker_type: "", role_title: "", role_level: "", career_goals: "", manager_feedback: "" });
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newSkill, setNewSkill] = useState({ competency_area: COMPETENCIES[0], skill_name: "", required_level: 3, notes: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [dbReady] = useState(SUPABASE_URL !== "YOUR_SUPABASE_URL");
  const [activeComp, setActiveComp] = useState(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("skill_mapper_anon_id");
    if (saved) setResumeId(saved);
  }, []);

  const applyLevelAdjustment = (level, roleLevel) => {
    if (roleLevel === "Junior")  return Math.max(1, level - 1);
    if (roleLevel === "Senior")  return Math.min(5, level + 1);
    return level; // Mid-level = base level unchanged
  };

  const getRoleSkills = (role, roleLevel) =>
    TAXONOMY.filter(([,r]) => r === role).map(([comp, , skill, level, notes]) => ({
      competency_area: comp, skill_name: skill,
      required_level: applyLevelAdjustment(level, roleLevel || profile.role_level),
      self_assessed_level: null, is_user_added: false, notes,
    }));

  const handleRoleSelect = (role) => {
    setProfile(p => ({ ...p, role_title: role }));
    setSkills(getRoleSkills(role, profile.role_level));
  };

  const saveProfile = async () => {
    if (!profile.role_title) return;
    setSaving(true);
    const newAnonId = genAnonId();
    setAnonId(newAnonId);

    if (dbReady) {
      try {
        const result = await sb.insert("users", {
          anonymous_id: newAnonId,
          worker_type: profile.worker_type || "HR",
          role_title: profile.role_title,
          role_level: profile.role_level || null,
          career_goals: profile.career_goals || null,
          manager_feedback: profile.manager_feedback || null,
        });
        const user = Array.isArray(result) ? result[0] : null;
        if (user && user.id) {
          setUserId(user.id);
          localStorage.setItem("skill_mapper_anon_id", newAnonId);
          localStorage.setItem("skill_mapper_user_id", user.id);
          // Save all skills immediately with the fresh userId
          const roleSkills = getRoleSkills(profile.role_title, profile.role_level);
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
          alert("Could not save profile to Supabase:\n" + msg);
        }
      } catch (e) {
        console.error("Save profile failed:", e);
        alert("Connection error: " + e.message);
      }
    } else {
      const fakeId = "local-" + Date.now();
      setUserId(fakeId);
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
      if (dbSkills.length) setSkills(dbSkills);
      else setSkills(getRoleSkills(user.role_title));
      localStorage.setItem("skill_mapper_anon_id", user.anonymous_id);
      localStorage.setItem("skill_mapper_user_id", user.id);
      setStep("skills");
    } catch (e) { console.error(e); }
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
      } catch (e) { console.error(e); }
    } else {
      setSaveMsg("Saved locally ✓");
      setTimeout(() => setSaveMsg(""), 2000);
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
    // Use state userId or fall back to localStorage in case state hasn't updated yet
    const activeUserId = userId || localStorage.getItem("skill_mapper_user_id");
    if (activeUserId && dbReady) {
      try {
        const result = await sb.upsert("user_skills", {
          user_id: activeUserId,
          competency_area: updated.competency_area,
          skill_name: updated.skill_name,
          required_level: updated.required_level,
          self_assessed_level: updated.self_assessed_level || null,
          is_user_added: updated.is_user_added || false,
          notes: updated.notes || null,
        }, "user_id,competency_area,skill_name");
        if (result?.message || result?.error) {
          console.error("Skill save error:", result?.message || result?.error);
        }
      } catch (e) { console.error("Auto-save failed:", e); }
    } else if (!activeUserId) {
      console.warn("Skill not saved — no userId. Complete profile step first.");
    }
  };

  const generateInsight = useCallback(async () => {
    if (insightLoading) return;
    setInsightLoading(true);
    setInsight("");

    // Build full competency breakdown
    const compData = COMPETENCIES.map(c => {
      const cs = skills.filter(s => s.competency_area === c && s.self_assessed_level != null);
      const all = skills.filter(s => s.competency_area === c);
      const totalGap = cs.reduce((a,s) => a + Math.max(0, s.required_level - s.self_assessed_level), 0);
      const avgRequired = all.length ? all.reduce((a,s) => a + s.required_level, 0) / all.length : 0;
      const avgSelf = cs.length ? cs.reduce((a,s) => a + s.self_assessed_level, 0) / cs.length : null;
      return { comp: c, totalGap, avgRequired: avgRequired.toFixed(1), avgSelf: avgSelf ? avgSelf.toFixed(1) : "not rated", rated: cs.length, total: all.length };
    }).filter(x => x.rated > 0).sort((a,b) => b.totalGap - a.totalGap);

    // Build full skill breakdown
    const skillData = skills
      .filter(s => s.self_assessed_level != null)
      .map(s => ({ skill: s.skill_name, comp: s.competency_area, required: s.required_level, self: s.self_assessed_level, gap: s.required_level - s.self_assessed_level }))
      .sort((a,b) => b.gap - a.gap);

    const biggestGapComp = compData[0];
    const strongestComp = [...compData].sort((a,b) => a.totalGap - b.totalGap)[0];
    const topGapSkills = skillData.filter(s => s.gap > 0).slice(0, 5);
    const metSkills = skillData.filter(s => s.gap <= 0);

    const prompt = `You are a warm career coach writing a short, punchy skill snapshot for an HR professional. Be direct, specific, and encouraging. Maximum 2 short sentences — no fluff, no preamble.

PERSON: ${profile.role_title}${profile.role_level ? ` (${profile.role_level})` : ""}
${profile.career_goals ? `GOALS: ${profile.career_goals}` : ""}
${profile.manager_feedback ? `MANAGER FEEDBACK: ${profile.manager_feedback}` : ""}
STRONGEST AREA: ${strongestComp?.comp || "N/A"}
BIGGEST GAP: ${biggestGapComp?.comp || "N/A"} (avg required ${biggestGapComp?.avgRequired}/5, avg self-rated ${biggestGapComp?.avgSelf}/5)
TOP 2 PRIORITY SKILLS: ${topGapSkills.slice(0,2).map(s=>`${s.skill} (you: ${s.self}/5, need: ${s.required}/5)`).join(" · ")}

Write exactly 2 sentences. Sentence 1: one strength + the biggest gap in plain language. Sentence 2: the 2 priority skills to focus on, end with encouragement. Use "you/your". No bullet points. Under 60 words total.`;

    try {
      const res = await fetch("http://localhost:3001/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setInsight(text);
    } catch(e) { setInsight("Unable to generate insight — check your connection."); }
    setInsightLoading(false);
  }, [skills, profile, insightLoading]);

  const grouped = COMPETENCIES.map(c => ({ comp: c, skills: skills.filter(s => s.competency_area === c) })).filter(g => g.skills.length);
  const totalGap = skills.reduce((a, s) => a + (s.self_assessed_level ? Math.max(0, s.required_level - s.self_assessed_level) : 0), 0);
  const assessed = skills.filter(s => s.self_assessed_level != null).length;

  // ── STYLES ──
  const S = {
    app: { minHeight:"100vh", background:"#EAF3F6", fontFamily:"'DM Sans', sans-serif", color:"#071945" },
    header: { background:"#071945", borderBottom:"none", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" },
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

  const stepNum = { welcome:0, profile:1, skills:2, assess:2, chart:3 }[step] || 0;

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
          {!dbReady && <p style={{ fontSize:11, color:"#FF5D00", marginTop:20 }}>⚠ Demo mode — Supabase not configured. Data won't persist across page reloads.</p>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[["Select your role","Choose from 6 HR functions — the taxonomy loads automatically","#0032FF"],
            ["Verify your skills","Add, remove or adjust skills to match your actual context","#21CBA6"],
            ["See your gaps","Spider chart shows required vs self-assessed across all competencies","#500B71"]
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
                style={{ padding:"12px 8px", borderRadius:10, border:`2px solid ${profile.role_title===r?"#0032FF":"#D6E4F0"}`, background: profile.role_title===r?"#0032FF":"#fff", color: profile.role_title===r?"#fff":"#071945", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                {r}
              </button>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
              <label style={S.label}>Role level (optional)</label>
              <div style={{ display:"flex", gap:8 }}>
                {["Junior","Mid-level","Senior"].map(l => (
                  <button key={l} onClick={() => {
                    const newLevel = profile.role_level === l ? "" : l;
                    setProfile(p => ({...p, role_level: newLevel}));
                    if (profile.role_title) setSkills(getRoleSkills(profile.role_title, newLevel));
                  }}
                    style={{ flex:1, padding:"9px 8px", borderRadius:8, border:`2px solid ${profile.role_level===l?"#0032FF":"#D6E4F0"}`, background: profile.role_level===l?"#0032FF":"#fff", color: profile.role_level===l?"#fff":"#071945", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
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
            onClick={saveProfile} disabled={!profile.role_title || saving}>
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
            <button onClick={() => setStep("profile")}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:13, padding:0, display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
              ← Profile
            </button>
            <div style={{ width:1, height:16, background:"#E5E7EB" }} />
            <div>
              <div style={S.h2}>{profile.role_title} · Skill profile</div>
              <div style={{ fontSize:13, color:"#6B7280" }}>{skills.length} skills across {grouped.length} competencies · {assessed} rated</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...S.btnSm, background:"#0032FF", color:"#fff", border:"none" }} onClick={() => setShowAddForm(v=>!v)}>
              + Add skill
            </button>
            <button style={{ ...S.btn, ...S.btnPrimary, padding:"6px 16px", fontSize:13 }} onClick={() => setStep("chart")}>
              View chart →
            </button>
          </div>
        </div>

        {/* Proficiency legend */}
        <div style={{ background:"#EAF3F6", border:"1px solid #B8CFE0", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#071945", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Proficiency scale — rate each skill below</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:6 }}>
            {[
              [1,"Awareness","Knows it exists; can recognise it","#4A6B8A","#fff","#B8CFE0"],
              [2,"Foundation","Basic understanding; needs guidance","#071C77","#E6EBFF","#071C77"],
              [3,"Practitioner","Applies independently in most situations","#0032FF","#0032FF","#0032FF"],
              [4,"Advanced","Deep expertise; coaches others","#500B71","#F0E8F5","#500B71"],
              [5,"Expert","Sets the standard for the org","#fff","#071945","#071945"],
            ].map(([n, label, desc, textColor, bg, border]) => (
              <div key={n} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:8, padding:"8px 10px", display:"flex", flexDirection:"column", gap:3 }}>
                <div style={{ fontSize:16, fontWeight:800, color: n===3?"#fff":n===5?"#fff":textColor, lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:11, fontWeight:700, color: n===3?"#fff":n===5?"#fff":textColor }}>{label}</div>
                <div style={{ fontSize:10, color: n===3?"rgba(255,255,255,0.8)":n===5?"rgba(255,255,255,0.7)":textColor, opacity: n===3||n===5?1:0.75, lineHeight:1.3 }}>{desc}</div>
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
        {grouped.map(({ comp, skills: compSkills }) => {
          const cc = COMP_COLORS[comp];
          const compAssessed = compSkills.filter(s=>s.self_assessed_level!=null).length;
          return (
            <div key={comp} style={{ ...S.card, marginBottom:12, borderLeft:`4px solid ${cc.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:cc.dot }} />
                  <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{comp}</div>
                </div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>{compAssessed}/{compSkills.length} rated</div>
              </div>
              {compSkills.map(sk => (
                <SkillRow key={sk.skill_name+sk.competency_area} skill={sk} onUpdate={updateSkill} onRemove={removeSkill} />
              ))}
            </div>
          );
        })}

        {/* Sticky next button — appears once at least one skill is rated */}
        {assessed > 0 && (
          <div style={{ position:"sticky", bottom:20, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
            <div style={{ display:"flex", gap:10, background:"#071945", border:"none", borderRadius:16, padding:"10px 16px", boxShadow:"0 4px 24px rgba(7,25,69,0.25)", pointerEvents:"all" }}>
              <div style={{ fontSize:12, color:"#93B8D4", alignSelf:"center" }}>
                {assessed}/{skills.length} skills rated
              </div>
              <button style={{ ...S.btn, background:"#0032FF", color:"#fff", padding:"8px 20px", fontSize:13 }}
                onClick={() => { saveSkills(); setStep("chart"); }}>
                View my skill chart →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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

        {/* AI Insight summary */}
        <div style={{ ...S.card, marginBottom:16, background:"#071945", border:"none" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#21CBA6", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                Your skill snapshot
              </div>
              {insightLoading && (
                <div style={{ fontSize:13, color:"#93B8D4", fontStyle:"italic" }}>Generating insight…</div>
              )}
              {!insightLoading && insight && (
                <div style={{ fontSize:14, color:"#EAF3F6", lineHeight:1.7 }}>{insight}</div>
              )}
              {!insightLoading && !insight && (
                <div style={{ fontSize:13, color:"#4A6B8A" }}>
                  {skills.some(s => s.self_assessed_level != null)
                    ? "Click to generate a personalised insight based on your gaps."
                    : "Complete your self-assessment first, then generate an insight."}
                </div>
              )}
            </div>
            <button onClick={generateInsight} disabled={insightLoading || !skills.some(s=>s.self_assessed_level!=null)}
              style={{ ...S.btn, background:"#0032FF", color:"#fff", padding:"8px 14px", fontSize:12, flexShrink:0, opacity: skills.some(s=>s.self_assessed_level!=null) ? 1 : 0.4 }}>
              {insightLoading ? "…" : insight ? "Refresh" : "Generate insight"}
            </button>
          </div>
        </div>

        {/* Spider + Drill-down side by side */}
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
                {/* Legend */}
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
                  const strong    = rated.filter(s => s.required_level - s.self_assessed_level <= 0);
                  const developing = rated.filter(s => s.required_level - s.self_assessed_level === 1);
                  const lacking   = rated.filter(s => s.required_level - s.self_assessed_level > 1);
                  const unrated   = all.filter(s => s.self_assessed_level==null);
                  const cc = COMP_COLORS[c];
                  const overallStatus = rated.length === 0 ? "not rated"
                    : lacking.length > 0 ? "needs work"
                    : developing.length > 0 ? "developing"
                    : "strong";
                  const statusColor = overallStatus === "strong" ? "#0F8A6E" : overallStatus === "developing" ? "#CC4A00" : overallStatus === "needs work" ? "#CC0000" : "#4A6B8A";

                  return (
                    <div key={c} onClick={() => setActiveComp(c)}
                      style={{ marginBottom:8, cursor:"pointer", padding:"10px 12px", borderRadius:10, border:`1px solid transparent`, transition:"all 0.15s", background:"#FAFCFE" }}
                      onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${cc.border}`; e.currentTarget.style.background="#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.border="1px solid transparent"; e.currentTarget.style.background="#FAFCFE"; }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontWeight:700, fontSize:13, color:"#071945", display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:cc.dot, display:"inline-block", flexShrink:0 }} />
                          {c}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, color:statusColor, background: overallStatus==="strong"?"#E0F8F3":overallStatus==="developing"?"#FFF0E8":overallStatus==="needs work"?"#FFE8E8":"#EAF3F6", padding:"2px 8px", borderRadius:10 }}>
                          {overallStatus}
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:12, marginTop:5, flexWrap:"wrap" }}>
                        {rated.length === 0
                          ? <span style={{ fontSize:11, color:"#4A6B8A", fontStyle:"italic" }}>Not yet rated — click to assess</span>
                          : <>
                              {strong.length > 0     && <span style={{ fontSize:11, color:"#0F8A6E", fontWeight:600 }}>{strong.length}/{all.length} meet</span>}
                              {developing.length > 0  && <span style={{ fontSize:11, color:"#CC4A00", fontWeight:600 }}>{developing.length}/{all.length} developing</span>}
                              {lacking.length > 0    && <span style={{ fontSize:11, color:"#CC0000", fontWeight:600 }}>{lacking.length}/{all.length} lacking</span>}
                              {unrated.length > 0    && <span style={{ fontSize:11, color:"#4A6B8A" }}>{unrated.length} not rated</span>}
                            </>
                        }
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <button onClick={() => setActiveComp(null)}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#4A6B8A", fontSize:18, padding:0, lineHeight:1 }}>←</button>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:COMP_COLORS[activeComp].dot }} />
                    <div style={{ fontSize:13, fontWeight:700, color:"#071945" }}>{activeComp}</div>
                  </div>
                </div>
                {/* Mini spider for this competency's skills */}
                <CompetencySpider skills={skills.filter(s => s.competency_area === activeComp)} color={COMP_COLORS[activeComp]} />
                {/* Skill level breakdown below spider */}
                <div style={{ marginTop:8 }}>
                  {skills.filter(s => s.competency_area===activeComp).map(sk => {
                    const gap = sk.self_assessed_level != null ? sk.required_level - sk.self_assessed_level : null;
                    const status = gap === null ? null : gap > 2 ? "needs work" : gap > 0 ? "developing" : gap === 0 ? "on track" : "exceeds";
                    const statusColor = gap === null ? "#4A6B8A" : gap > 2 ? "#CC0000" : gap > 0 ? "#CC4A00" : "#0F8A6E";
                    const statusBg   = gap === null ? "#EAF3F6" : gap > 2 ? "#FFE8E8" : gap > 0 ? "#FFF0E8" : "#E0F8F3";
                    return (
                      <div key={sk.skill_name} style={{ padding:"8px 0", borderBottom:"1px solid #EAF3F6" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#071945" }}>{sk.skill_name}</div>
                          {status && (
                            <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:statusBg, padding:"2px 8px", borderRadius:10 }}>
                              {status}
                            </span>
                          )}
                        </div>
                        {/* 5-pip proficiency ladder */}
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          {[1,2,3,4,5].map(lvl => {
                            const isSelf = sk.self_assessed_level === lvl;
                            const isReq  = sk.required_level === lvl;
                            const belowSelf = sk.self_assessed_level && lvl <= sk.self_assessed_level;
                            const inGap  = sk.self_assessed_level && lvl > sk.self_assessed_level && lvl <= sk.required_level;
                            const aboveReq = sk.self_assessed_level && lvl <= sk.self_assessed_level && lvl > sk.required_level;
                            const bg = !sk.self_assessed_level
                              ? (lvl <= sk.required_level ? "#B8CFE0" : "#EAF3F6")
                              : inGap ? "#FFBDAA"
                              : aboveReq ? "#A8EBD8"
                              : belowSelf ? "#99B8FF"
                              : "#EAF3F6";
                            return (
                              <div key={lvl} style={{ position:"relative", flex:1 }}>
                                <div style={{
                                  height:8, borderRadius:4, background:bg,
                                  outline: isSelf ? "2px solid #0032FF" : isReq ? "2px solid #071945" : "none",
                                  outlineOffset:1, transition:"background 0.3s"
                                }} />
                                {(isSelf || isReq) && (
                                  <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", fontSize:8, fontWeight:700, color: isSelf ? "#0032FF" : "#071945", whiteSpace:"nowrap" }}>
                                    {isSelf && isReq ? "you / req" : isSelf ? "you" : "req"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#B8CFE0", marginTop:18 }}>
                          {["Awareness","Foundation","Practitioner","Advanced","Expert"].map(l => (
                            <span key={l} style={{ flex:1, textAlign:"center" }}>{l}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top gaps */}
        <div style={S.card}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Top priority gaps</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:16 }}>Skills where your current level is furthest from what's required</div>
          {skills.filter(s=>s.self_assessed_level!=null&&s.required_level-s.self_assessed_level>0)
            .sort((a,b)=>(b.required_level-b.self_assessed_level)-(a.required_level-a.self_assessed_level))
            .slice(0,8)
            .map(sk => {
              const gap = sk.required_level - sk.self_assessed_level;
              const cc = COMP_COLORS[sk.competency_area];
              const status = gap > 2 ? "needs work" : "developing";
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
                    <span style={{ fontSize:10, fontWeight:700, color:statusColor, background:statusBg, padding:"2px 8px", borderRadius:10, flexShrink:0 }}>
                      {status}
                    </span>
                  </div>
                  {/* Proficiency ladder */}
                  <div style={{ display:"flex", gap:4 }}>
                    {[1,2,3,4,5].map(lvl => {
                      const isSelf = sk.self_assessed_level === lvl;
                      const isReq  = sk.required_level === lvl;
                      const belowSelf = lvl <= sk.self_assessed_level;
                      const inGap = lvl > sk.self_assessed_level && lvl <= sk.required_level;
                      const bg = inGap ? "#FFBDAA" : belowSelf ? "#99B8FF" : "#EAF3F6";
                      return (
                        <div key={lvl} style={{ position:"relative", flex:1 }}>
                          <div style={{
                            height:10, borderRadius:4, background:bg,
                            outline: isSelf ? "2px solid #0032FF" : isReq ? "2px solid #071945" : "none",
                            outlineOffset: 1,
                          }} />
                          {(isSelf || isReq) && (
                            <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", fontSize:9, fontWeight:700, color: isSelf ? "#0032FF" : "#071945", whiteSpace:"nowrap" }}>
                              {isSelf && isReq ? "you / req" : isSelf ? `you · ${LEVEL_LABELS[lvl]}` : `req · ${LEVEL_LABELS[lvl]}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop:28 }} />
                </div>
              );
            })}
          {!skills.some(s=>s.self_assessed_level!=null) && (
            <div style={{ color:"#9CA3AF", fontSize:13, textAlign:"center", padding:"20px 0" }}>
              Go back and self-assess your skills to see gaps here.
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => setStep("skills")}>← Back to skills</button>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setStep("learning")}>
            View learning recommendations →
          </button>
        </div>
      </div>
    </div>
  );
}
