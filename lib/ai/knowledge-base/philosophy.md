# Work Philosophy & Approach

<!--
  This file should contain your philosophy on software development, architecture,
  and technology. This is where your opinions and perspectives shine through.
  Write in third person.

  Topics to cover:
  - Software development philosophy
  - Architecture principles
  - Team collaboration approach
  - Views on technology choices
  - Code quality beliefs
  - Testing philosophy
  - Agile/methodology preferences
-->

## Software Development Philosophy

Simon believes that software development is fundamentally about **making change safe and sustainable** rather than chasing perfection. For him, good engineering creates a predictable way of changing systems, even when those systems are complex and old. He values small, well-understood steps over big-bang rewrites and tries to keep architecture close to how teams and businesses actually work.

He prefers a product mindset over a project mindset: teams should be close to the problem, own their outcomes, and be trusted to make trade-offs with context rather than follow requirements blindly.

### Code Quality

Simon sees code quality as an enabler of safe change, not as an aesthetic goal. He cares about clarity, explicitness, and reducing accidental complexity. He favours small, focused modules, clear boundaries, and naming that reflects the business language.

He considers code reviews a key part of quality: not just for catching bugs, but for sharing context, challenging design decisions, and helping the team converge on common patterns. Technical debt is acceptable when it is intentional, visible, and actively managed; dangerous when it is invisible and ignored.

### Testing Approach

Simon’s philosophy on testing is that tests should give teams confidence to change things. He prefers a layered approach: fast unit tests for critical logic, integration tests around boundaries and contracts, and end-to-end tests for the most important user journeys.

He does not treat TDD as a religion, but sees test-first approaches as useful in domains where correctness and behavior are subtle. He is more concerned with the **right tests in the right places** than with coverage numbers.

### Documentation

Simon favours documentation that is **alive, concise, and close to the work**. He prefers architecture decision records, clear READMEs, and onboarding guides over long, static documents that no one reads.

He encourages teams to document how to run, test, and deploy systems, as well as the rationale behind major architectural choices. For him, good documentation lowers the cost of joining a team, debugging issues, and making informed changes months or years later.

## Architecture Principles

### Simplicity First

Simon starts from the principle that simple systems fail less and are easier to change. He tries to avoid premature complexity, over-engineering, and fashionable patterns that do not match the actual needs of the business.

He prefers a small number of well-chosen components with clear responsibilities over sprawling architectures with many overlapping tools. When in doubt, he leans towards patterns the team can understand and operate confidently.

### Design for Outages, Not Uptime

Drawing on his experience with cloud and real-world incidents, Simon believes systems should be designed assuming outages will happen. Instead of chasing “perfect uptime,” he focuses on graceful degradation, clear failure modes, and recovery paths.

He values redundancy, idempotency, and clear fallbacks so that when something fails—whether it is a cloud region, a third-party service, or a critical dependency—the impact on users and the business is contained.

### Technology Choices in Context

Simon approaches technology choices with pragmatism. He looks at the problem domain, team skills, existing systems, and time horizons before recommending tools. He sees architecture as a long-term conversation between business constraints and technical possibilities, not as a one-time decision.

He prefers technologies with healthy ecosystems, strong community support, and a good operational story, especially in retail and commerce where reliability and time-to-market matter.

## Team Collaboration

### Communication

Simon favours clear, honest, and frequent communication, especially in remote and distributed teams. He prefers asynchronous communication where possible (well-written documents, issues, RFCs) and uses synchronous time for alignment, decision-making, and complex discussions.

He encourages transparency about risks, trade-offs, and uncertainties so that teams and stakeholders can make better decisions together.

### Code Reviews

For Simon, code reviews are about **shared ownership and learning**. He encourages reviews that focus on behavior, readability, and architectural alignment rather than nitpicking formatting. He sees reviews as a place to pass on context, suggest alternatives, and help less experienced team members grow.

He values psychological safety in reviews: it should be safe to ask naïve questions, challenge decisions, and admit uncertainty.

### Mentoring

Simon enjoys mentoring developers, solution engineers, and new leaders. His approach is to provide context and mental models rather than just answers, helping people connect their day-to-day work to broader architectural and business considerations.

He prefers to give concrete feedback anchored in real situations and to create growth opportunities by letting people stretch into new responsibilities with support.

## Development Practices

### Agile & Methodologies

Simon appreciates Agile principles more than branded frameworks. He values short feedback loops, close collaboration between product and engineering, and incremental delivery. He is comfortable working with Scrum and Kanban, but tends to simplify processes when they become ceremony-heavy.

In scaled environments, he is cautious about frameworks like SAFe, using them only where they genuinely help coordination and not as an excuse to centralize control or flood teams with process.

### Continuous Improvement

Continuous improvement for Simon is about small, frequent adjustments. He encourages teams to regularly reflect on what is working and what is not, and to experiment with changes in tooling, process, and architecture.

He keeps himself current by experimenting with new tools in personal projects (e.g., AI tooling, new frontend capabilities, data platforms) before recommending them in client contexts.

### DevOps & Operations

Simon sees development and operations as a shared responsibility. He prefers setups where product teams own their services end-to-end, including deployment, monitoring, and incident response, with platform teams providing paved roads and shared capabilities.

He emphasizes observability, clear SLIs/SLOs, and runbooks so that teams are not surprised by production behaviour and can respond effectively when things go wrong.

## Technology Choices

### Pragmatism vs. Perfectionism

Simon consciously chooses pragmatism over perfectionism. He would rather ship a solid, understandable solution that can evolve than a perfect architecture that only a few people can operate.

He cares about long-term maintainability, but recognizes that organizations have budgets, politics, and legacy constraints. His goal is often to find the **next right step** rather than the theoretically perfect end state.

### Choosing the Right Tool

When evaluating tools and platforms, Simon considers:

- Fit with the problem domain and existing ecosystem  
- Team familiarity and learning curve  
- Operational characteristics (reliability, observability, support)  
- Vendor lock-in and exit strategies  

He is comfortable mixing best-of-breed SaaS with custom services as long as responsibilities are clear and the system remains understandable.

### Open Source

Simon has a strong bias towards open standards and open source tooling where it makes sense. He hosts his own projects publicly and appreciates the transparency and learning that come from seeing how others solve similar problems.

He values contributing back through documentation, examples, and frameworks, even when direct code contributions are not always feasible.

## Work-Life Balance & Sustainability

Simon believes that sustainable pace and trust are prerequisites for good engineering. He is a strong proponent of remote work when done intentionally: with clear expectations, good communication practices, and a focus on outcomes over hours.

He is wary of hero culture and burnout. For him, healthy teams are those that can handle incidents without sacrificing long-term well-being, where people can take time off without everything falling apart, and where careers are measured in impact and learning, not just in shipping emergencies.
