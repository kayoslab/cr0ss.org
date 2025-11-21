# Notable Projects

<!--
  This file should contain notable projects you've worked on.
  Write in third person.

  For each project, include:
  - Project name and purpose
  - Your role
  - Technologies used
  - Challenges faced
  - Solutions implemented
  - Results/impact (with metrics if possible)
  - What you learned
-->

## Featured Projects

### MACH Architecture Reference Platform (MARP) & Retail Accelerators

**Role:** Lead architect / technology lead  
**Period:** [Timeframe]  
**Technologies:** Next.js, TypeScript, Vercel, commercetools, headless CMS/DAM, modern search, cloud platforms (AWS/Azure), documentation and diagramming tools

This project brought together Simon’s experience in commerce and architecture into a set of reference architectures and accelerators for retailers considering a move to composable commerce and MACH-aligned stacks.

**Challenge:**  
Retailers in the DACH region often understood the buzzwords around MACH and composable commerce but struggled to see what it would look like for them: which components they needed, how migration would work, and how to keep risk under control. Sales decks and generic vendor diagrams were not enough to bridge the gap between ambition and concrete plans.

**Solution:**  
Simon co-designed the MACH Architecture Reference Platform (MARP) and related frameworks such as the Retail Resilience Hex Grid and Black Week scalability patterns. These combined conceptual architecture, integration patterns, and practical “how to get there” guidance. The work was packaged as reusable diagrams, documents, and narratives that consultants could use across client engagements.

**Impact:**  
The accelerators helped Equal Experts articulate a clear, opinionated point of view on modern commerce to retailers and prospects. They supported discovery, pre-sales, and early architecture work, enabling conversations to move beyond abstract benefits into concrete migration paths and trade-offs.

**Key Learnings:**  
Simon deepened his conviction that frameworks have to be grounded in real client experience to be useful. He also saw how much value teams gain when architecture work is documented in a way that non-engineers can understand and challenge.

---

### Composable Commerce Migration Readiness Questionnaire

**Role:** Designer and architect of the framework  
**Period:** [Timeframe]  
**Technologies:** Google Sheets / CSV, analysis scripts, internal documentation, presentation material, RAG/AI experiments for analysis

This project focused on building a structured way to assess an organization’s readiness to migrate from a monolithic commerce platform to a composable stack.

**Challenge:**  
Retailers often struggled to understand whether they were truly ready for a composable migration. Different groups—engineering, product, business, leadership—had conflicting views, and conversations were dominated by anecdotes and opinions rather than structured insight.

**Solution:**  
Simon designed a multi-role questionnaire covering domains such as architecture, system maturity, delivery practices, strategy, sponsorship, and culture. Questions were tagged by themes (e.g., strategic sponsorship, composable integration, team autonomy) and exported to CSV/Sheets to allow scoring, aggregation, and visualization. He also experimented with AI-assisted analysis and reporting based on questionnaire results.

**Impact:**  
The framework made it easier to have honest conversations about readiness and risk. It helped highlight misalignment between roles, surface hidden constraints, and identify the most impactful first steps in a migration rather than defaulting to full replatforming.

**Key Learnings:**  
Simon saw how powerful it is to combine qualitative input with light structure and scoring. He also learned how AI can support, but not replace, human judgment in interpreting organizational readiness.

---

## Personal Projects

### cr0ss.org (This Website)

**Technologies:** Next.js, React, TypeScript, Tailwind CSS, Vercel, Neon PostgreSQL, Vercel KV, Tremor, content tooling for markdown/MDX

**Purpose:** Personal website, blog, and experimentation space

cr0ss.org is Simon’s home on the web. It serves as a blog, portfolio, and a playground for ideas around architecture, data, and personal analytics. The site brings together writing on topics like composable commerce, personalization, remote work, and architectural thinking, alongside interactive dashboards and experiments.

**Features:**
- Blog covering composable commerce, architecture, remote work, and leadership.
- Data dashboards visualizing personal rituals and metrics (e.g., coffee, focus, micro-rituals) using Tremor.
- Experiments with maps, live/visited location visualizations, and AI-assisted content.
- Foundations for the AI-powered “Simon-bot” that uses a knowledge base and RAG over this content.

**Technical Highlights:**
- Use of Next.js and Vercel for a fast, edge-centric web experience, including preview deployments and incremental updates.
- Typed content and data models using TypeScript, ensuring consistent handling of posts, dashboards, and configuration.
- Integration of Neon PostgreSQL and Vercel KV to store and query personal metrics and configuration for dashboards.
- Separation of presentation, content, and data layers to make the site an extensible playground for future experiments.

---

### Head-Tracked Headlamp Experiment (ESP32 & IMU)

**Technologies:** ESP32, BNO085 9-DOF IMU, brushless gimbal motors, BaseCam SimpleBGC, custom frame design

Simon has been exploring a hardware experiment using an ESP32 microcontroller, an Adafruit BNO085 orientation sensor, and brushless gimbal motors to build a headlamp that can track yaw, pitch, and roll.

**Purpose:**  
The project combines his interest in hardware with his systems thinking on control loops, sensor fusion, and user experience. It is a way to step outside pure web development while still applying software engineering rigor to a physical system.

**Key Aspects:**
- Sensor fusion using the BNO085’s built-in capabilities.
- Communication between separate ESP32 boards via Bluetooth LE.
- Control of gimbal motors via a dedicated controller board and custom frame design.

**Key Learnings:**  
The project reinforces how important it is to think end-to-end—from sensor noise and mechanical constraints up to user interaction. It also provides a different but related perspective on latency, stability, and failure modes.

---

## Open Source Contributions

Simon maintains and evolves his personal repositories publicly, including the source for cr0ss.org and related experiments. These repos serve as living documentation of his approach to architecture, TypeScript, and modern frontend tooling.

### cr0ss.org Repository

The public codebase for cr0ss.org showcases:

- How Simon structures a modern Next.js + TypeScript application.  
- His approach to typed content, data visualization, and dashboarding.  
- Experiments with AI, RAG, and personal analytics.

## Side Projects & Experiments

Simon frequently starts small experiments to explore new ideas before bringing them into client work. These include:

- AI-assisted tools for migration readiness assessments and proposal drafting.  
- Dashboards and visualizations for personal metrics and focus rituals.  
- Prototypes around AI-powered subpages and assistants built on his own knowledge base.  

Many of these experiments start as small features on cr0ss.org and evolve into reusable patterns or frameworks for his consulting work.
