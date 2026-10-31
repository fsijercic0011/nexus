# NEXUS

## Personal Environment Management System

### Product Concept & Technical Foundation

**Date:** 31 October 2026

------------------------------------------------------------------------

## 1. Product vision

NEXUS is a cloud-hosted platform for managing and understanding a
household and the personal environment within it.

The goal is to create a useful digital representation of the things,
people, activities, resources, and connected devices that make up
day-to-day life. Rather than maintaining separate disconnected
applications, NEXUS brings these domains together through a shared data
model, common workflows, and a unified interface.

The initial vision includes:

-   A digital wardrobe containing owned clothing, availability, laundry
    state, and outfit combinations.
-   A kitchen and household inventory covering food, toiletries,
    cleaning products, and other supplies.
-   Activities, plans, tasks, routines, and calendar events.
-   Financial records, spending, budgets, investments, assets, and
    liabilities.
-   Connected appliances, sensors, Arduino/ESP32 devices, and home
    automation.
-   A searchable knowledge base for manuals, warranties, receipts, and
    other household documents.

The long-term ambition is a digital representation of the household and
its state---not simply a collection of CRUD screens.

### 1.1 Product decisions

  -----------------------------------------------------------------------
  Decision                            Current direction
  ----------------------------------- -----------------------------------
  Scope                               Household

  Hosting                             Cloud

  Main interaction                    Dashboard, mobile interface, and
                                      scanning

  Automation                          Manual and automated workflows

  Product vision                      Digital representation of the
                                      household and personal environment

  Product name                        NEXUS
  -----------------------------------------------------------------------

These are working decisions and can be revised as requirements become
more concrete.

## 2. Core product principles

1.  **One source of truth.** A physical item, device, task, or
    transaction should have one authoritative record.
2.  **Current state and history.** NEXUS should show what is true now
    and retain meaningful records of how that state changed.
3.  **Manual operation first.** Every important workflow should remain
    usable without sensors, integrations, or AI.
4.  **Automation with control.** Users should be able to choose whether
    a rule runs automatically, asks for approval, or only makes a
    suggestion.
5.  **Privacy by design.** Household-shared information and private
    member information must be distinguishable.
6.  **Fast capture.** Adding an item, expense, task, or note should take
    as little effort as possible, especially on mobile.
7.  **Modular growth.** Domains should be independently understandable
    while sharing common platform capabilities.
8.  **AI as an assistant, not an authority.** AI may identify,
    recommend, and propose changes, but consequential changes should be
    validated.

## 3. Product architecture and domains

NEXUS should be designed as a coherent platform with distinct domain
modules.

### 3.1 Household

The household is the primary tenancy and collaboration boundary.

Responsibilities:

-   Household creation and configuration.
-   Member invitations and roles.
-   Properties and rooms.
-   Shared and private resources.
-   Household-level preferences and settings.

A household may eventually contain multiple properties, such as a
primary home, a holiday home, or a garage/workshop.

### 3.2 Inventory

Tracks physical things owned or stored by household members.

Examples:

-   Clothing and accessories.
-   Electronics and appliances.
-   Tools and equipment.
-   Furniture.
-   Toiletries and cleaning supplies.
-   Food and other consumables.

Inventory needs to support both individually tracked assets and
quantity-based stock.

### 3.3 Kitchen

A specialized experience built on inventory concepts.

Responsibilities:

-   Food and ingredient stock.
-   Quantities and units.
-   Expiration dates and purchase history.
-   Recipes and meal planning.
-   Shopping lists.
-   Low-stock detection.
-   Optional links between ingredients and planned meals.

The Kitchen module should reuse the core inventory model rather than
create a separate, disconnected product database.

### 3.4 Activities

Tracks how household members organize and spend their time.

Responsibilities:

-   Tasks and to-do lists.
-   Calendar events.
-   Habits and routines.
-   Projects and plans.
-   Activity history.
-   Reminders and notifications.

### 3.5 Finances

Tracks the household's financial picture.

Potential responsibilities:

-   Accounts and balances.
-   Income and expenses.
-   Transactions and categories.
-   Budgets.
-   Assets and liabilities.
-   Investments.
-   Financial summaries and trends.

Bank synchronization and advanced financial analytics should not be part
of the first MVP.

### 3.6 Devices and IoT

Connects NEXUS to the physical environment.

Responsibilities:

-   Device registry.
-   Device capabilities and current state.
-   Sensor readings.
-   Appliance status.
-   Device commands.
-   Integrations and automation.

Examples include lights, temperature and humidity sensors, motion
detectors, smart plugs, washing machines, and custom ESP32/Arduino
devices.

### 3.7 Knowledge

A searchable home for information associated with household entities.

Examples:

-   Appliance manuals.
-   Receipts.
-   Warranties.
-   Invoices.
-   Product documentation.
-   Maintenance notes.
-   Photos and other attachments.

Documents should be attachable to relevant entities, such as an
appliance, purchase, room, or household.

### 3.8 Insights

Cross-domain summaries and recommendations.

Examples:

-   Items that are running low.
-   Upcoming expiration dates.
-   Tasks that have been overdue for a while.
-   Spending trends.
-   Maintenance that may be due.
-   Conflicts between plans and availability.
-   Suggested actions based on household state.

Insights should be built on reliable domain data, not on an independent
copy of that data.

## 4. Core conceptual model

NEXUS needs a small set of reusable concepts that can be shared across
modules.

### 4.1 Entity

An entity is anything NEXUS knows about and can uniquely identify.

Examples include a person, shirt, refrigerator, room, financial account,
task, or sensor.

Entities can have types, attributes, relationships, state, and history.

### 4.2 Location and container

These concepts should remain distinct.

-   **Location** describes where something is in the physical
    environment: a property, floor, room, or area.
-   **Container** describes an object or structure that holds other
    things: a wardrobe, drawer, refrigerator, toolbox, or storage box.

This allows a useful physical path such as:

`House → Kitchen → Refrigerator → Bottom drawer → Produce`

A container may itself be located inside another container or location.

### 4.3 Product and inventory item

A product definition describes what a commercial product is. An
inventory record describes what the household actually owns.

For example:

-   Product: a particular brand and type of toothpaste, with a barcode
    and standard package size.
-   Inventory record: the household's tube of that toothpaste, stored in
    the bathroom cabinet, with its current quantity or status.

This separation supports multiple owned instances of the same product
and prevents catalog information from being confused with household
stock.

### 4.4 Individually tracked assets and consumables

NEXUS should support two broad inventory patterns.

**Individually tracked assets**

-   A specific jacket.
-   A laptop.
-   A power drill.
-   A household appliance.

These have their own identity, condition, location, and lifecycle.

**Quantity-based consumables**

-   Rice.
-   Toothpaste.
-   Detergent.
-   Coffee.
-   Cleaning supplies.

These are tracked by quantity and unit. Optional stock lots can capture
purchase date, expiry date, or batch details.

### 4.5 State, event, transaction, and relationship

-   **State:** the current known condition of an entity.
-   **Event:** something that happened and may have changed state.
-   **Transaction:** a structured record of a financial or stock
    movement.
-   **Relationship:** a connection between entities, such as a device
    belonging to a room or a garment belonging to a person.

Examples of events include item registration, moving an item, marking
clothing as being washed, reducing product quantity after consumption,
completing a task, or changing a device state.

## 5. Data architecture

### 5.1 Database strategy

PostgreSQL is the recommended primary database.

Use relational tables for core entities, relationships, constraints, and
frequently queried fields. Use JSONB for genuinely variable
metadata---not as a substitute for a coherent relational model.

Conceptual schema groups:

  -----------------------------------------------------------------------
  Domain                              Example tables
  ----------------------------------- -----------------------------------
  Identity and tenancy                `users`, `households`,
                                      `household_members`, `invitations`,
                                      `roles`

  Physical structure                  `properties`, `locations`,
                                      `containers`

  Entity model                        `categories`, `entity_types`,
                                      `identifiers`

  Inventory                           `products`, `items`,
                                      `inventory_lots`,
                                      `stock_movements`, `item_images`

  State and history                   `entity_states`, `events`,
                                      `event_types`

  Activities                          `tasks`, `calendar_events`,
                                      `habits`, `projects`,
                                      `activity_logs`

  Finance                             `accounts`, `transactions`,
                                      `budgets`, `assets`, `liabilities`

  Devices                             `devices`, `device_capabilities`,
                                      `device_states`,
                                      `integration_connections`

  Automation                          `automation_rules`,
                                      `automation_runs`,
                                      `automation_actions`

  Platform                            `notifications`, `files`,
                                      `attachments`, `audit_logs`
  -----------------------------------------------------------------------

This is a conceptual starting point, not a final migration-ready schema.

### 5.2 Current state plus event history

Maintain current state for efficient reads, while retaining an
append-oriented history of meaningful changes.

A full event-sourcing architecture is not necessary for the first
version. A practical model is:

-   Update the current entity or inventory state.
-   Insert a corresponding event in the same database transaction.
-   Record the actor or source.
-   Record when the event occurred and when NEXUS recorded it.
-   Include structured, validated event data.

Useful event fields include entity identifier, event type, actor or
integration source, `occurred_at`, `recorded_at`, validated payload,
correlation identifier, and idempotency identifier where relevant.

### 5.3 Data integrity

-   Use explicit units for quantities and measurements.
-   Store timestamps consistently and handle time zones deliberately.
-   Validate state transitions.
-   Use database transactions for related changes.
-   Make integration ingestion idempotent.
-   Track provenance for externally sourced or inferred data.
-   Store confidence where a value is estimated rather than confirmed.

## 6. Cloud and local IoT architecture

The main NEXUS application is cloud-hosted to provide centralized
access, collaboration, storage, notifications, and cross-domain
workflows.

However, devices on a home network should not need to expose
unrestricted endpoints to the public internet.

### 6.1 Local home bridge

A local bridge connects the household network to the cloud platform.

Candidate components:

-   Home Assistant.
-   MQTT broker.
-   ESP32 and Arduino devices.
-   Sensors and appliances.
-   A small NEXUS bridge service.

The bridge can initiate an authenticated outbound connection to the
cloud and synchronize device state and events.

### 6.2 Offline behavior

Some home automations should continue working when the internet
connection is unavailable.

The architecture should define which actions execute locally, which
events are queued during outages, retry and backoff behavior,
duplicate-event protection, reconciliation when connectivity returns,
and how conflicting state changes are resolved.

Do not make essential local automation dependent on a continuous cloud
connection.

## 7. Application experience

### 7.1 Desktop navigation

A possible primary navigation structure:

1.  Overview
2.  Household
3.  Inventory
4.  Kitchen
5.  Activities
6.  Finances
7.  Devices
8.  Knowledge
9.  Insights
10. Automations
11. Settings

The exact navigation can evolve as the product becomes more concrete.

### 7.2 Global interface capabilities

The application should provide universal search, a quick-add action,
notification center, household switcher, member/profile menu,
cross-domain activity history, and an eventual natural-language
assistant.

Quick-add should allow a user to create a product, inventory item, task,
event, expense, note, or device without navigating through multiple
module screens.

### 7.3 Mobile experience

The mobile interface should prioritize quick actions rather than simply
shrink the desktop layout.

High-value mobile workflows:

-   Scan a barcode or QR code.
-   Add or consume an inventory item.
-   Update a shopping list.
-   Complete a task.
-   Check a device's state.
-   Capture a receipt or document.
-   Receive and act on notifications.

A responsive web application or PWA is a reasonable starting point.

## 8. Scanning and identification

Scanning should be a platform capability, not something limited to
inventory.

### 8.1 Scanning use cases

  -----------------------------------------------------------------------
  Input                               Intended use
  ----------------------------------- -----------------------------------
  Commercial barcode                  Identify a product and retrieve
                                      catalog information

  NEXUS QR code                       Open a known item, container,
                                      device, or location

  Object photograph                   Identify an object and prepare a
                                      draft record

  Receipt photograph                  Extract merchant, date, products,
                                      and prices

  Document photograph or file         Extract information and attach it
                                      to an entity
  -----------------------------------------------------------------------

### 8.2 Scanning pipeline

1.  Capture an image or scan.
2.  Recognize the barcode, QR code, object, or document.
3.  Resolve the identity against known records or an external catalog.
4.  Propose fields and the intended change.
5.  Validate the proposal.
6.  Ask for confirmation when appropriate.
7.  Create or update the record.
8.  Record the source and resulting event.

**Important:** scanning should normally propose a change rather than
silently mutate household stock. Identifying a toothpaste package does
not establish whether the user is adding it, consuming it, or simply
inspecting it.

### 8.3 Candidate technologies and data sources

-   Open Food Facts: https://world.openfoodfacts.org/
-   Google ML Kit or an equivalent mobile barcode-scanning library.
-   OCR for receipts and documents.
-   Image-recognition services for object identification.

External catalog data should be treated as untrusted input. Validate it
and retain its source.

## 9. Automation architecture

Use a reusable automation model:

`Trigger → Conditions → Actions → Execution tracking → Optional approval`

### 9.1 Automation modes

-   **Automatic:** execute when the rule matches.
-   **Approval required:** propose the action and wait for a user.
-   **Suggestion only:** notify or recommend, but do not execute.

### 9.2 Example rules

-   When an inventory quantity falls below its minimum, add the product
    to the shopping list and notify household members.
-   When a laundry cycle finishes, notify the relevant member.
-   When a garment is marked as being washed, make it unavailable for
    outfit suggestions.
-   When an outdoor activity is planned, use weather information to
    suggest suitable clothing.
-   When nobody is home, switch off selected nonessential devices.

### 9.3 Reliability requirements

Automation needs execution logs, bounded retries and backoff,
idempotency and duplicate-event protection, loop prevention and rate
limits, permission checks at execution time, approval for sensitive or
high-impact actions, and a clear distinction between requested,
accepted, executed, and failed actions.

## 10. Security and privacy

Security must be part of the platform foundation.

-   Enforce household and record authorization in the backend.
-   Scope household-owned records consistently, typically with
    `household_id`.
-   Consider PostgreSQL Row-Level Security as defense in depth.
-   Distinguish shared and private records.
-   Use TLS and managed encryption at rest.
-   Keep integration credentials out of frontend code.
-   Use signed, time-limited URLs for private media.
-   Audit sensitive and administrative changes.
-   Provide backups, restore procedures, and data export.
-   Apply least privilege to device integrations.
-   Define retention and deletion policies for financial records,
    images, and telemetry.

Authentication answers who the user is. Authorization determines what
that user may access. These must be treated as separate concerns.

## 11. Recommended technology stack

  Layer               Recommendation
  ------------------- -------------------------------------------------------
  Frontend            React + TypeScript + Vite
  UI                  Tailwind CSS + shadcn/ui
  Server state        TanStack Query
  Backend             Node.js + TypeScript + Fastify
  Database            PostgreSQL
  ORM                 Drizzle ORM
  Validation          Zod
  Authentication      Evaluate Better Auth or a managed identity provider
  File storage        Cloudflare R2 or an equivalent object-storage service
  Background jobs     BullMQ + Redis, when justified
  Realtime updates    WebSockets
  Home integration    Home Assistant + MQTT
  Local development   Docker

The exact stack is less important than clear boundaries, reliable data
handling, and maintainable implementation.

### 11.1 Architecture style

Start with a **modular monolith**:

-   One backend deployment.
-   One primary database.
-   Clearly separated domain modules.
-   Shared infrastructure and contracts.
-   Explicit module boundaries.

Do not start with microservices. Add queues, Redis, or separate services
only when concrete requirements justify their operational cost.

## 12. Suggested repository structure

``` text
nexus/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       ├── modules/
│   │       │   ├── household/
│   │       │   ├── inventory/
│   │       │   ├── kitchen/
│   │       │   ├── activities/
│   │       │   ├── finance/
│   │       │   ├── devices/
│   │       │   ├── knowledge/
│   │       │   └── insights/
│   │       ├── components/
│   │       ├── layouts/
│   │       └── services/
│   ├── api/
│   │   └── src/
│   │       ├── modules/
│   │       ├── infrastructure/
│   │       ├── integrations/
│   │       ├── events/
│   │       └── automation/
│   └── home-bridge/
│       └── src/
├── packages/
│   ├── database/
│   ├── shared/
│   ├── validation/
│   ├── event-contracts/
│   └── api-client/
├── infrastructure/
│   ├── docker/
│   └── deployment/
├── docs/
│   ├── architecture/
│   ├── specifications/
│   └── decisions/
└── docker-compose.yml
```

Use Architecture Decision Records (ADRs) for important choices. Each ADR
should document the problem, alternatives, chosen approach, rationale,
and consequences.

## 13. MVP: version 0.1

### 13.1 Objective

Deliver a cloud-hosted, multi-member household platform with a working
physical inventory, location hierarchy, scanning workflow, event
history, and basic automation.

### 13.2 Included functionality

-   Household creation and invitations.
-   Member roles and authorization.
-   Properties, rooms, locations, and nested containers.
-   Entity types and categories.
-   Product definitions and inventory records.
-   Item photographs and object storage.
-   Barcode and NEXUS QR scanning.
-   Quantity, availability, and location management.
-   Event history and audit records.
-   Shopping lists.
-   Low-stock notifications.
-   Basic automation rules and execution logs.
-   Responsive desktop dashboard and mobile PWA.

### 13.3 Explicitly excluded from the first MVP

-   Bank synchronization and advanced finance analytics.
-   Advanced AI or predictive recommendations.
-   Full smart-home integration and a custom hardware fleet.
-   Advanced wardrobe recommendations and outfit intelligence.
-   Complex cross-domain optimization.

These are valid future directions, but including them too early would
make the initial release difficult to finish and validate.

### 13.4 MVP acceptance criteria

A user should be able to:

1.  Create a household.
2.  Invite another member.
3.  Create a room or location.
4.  Create a container within that location.
5.  Register an inventory item.
6.  Scan a product and register it after reviewing the proposed
    information.
7.  Move an item and see the resulting event.
8.  Consume a product and reduce its quantity.
9.  Trigger a low-stock rule that updates the shopping list.
10. Complete a task and see who completed it and when.
11. View history only for records they are authorized to access.

## 14. Roadmap

### Phase 0 --- Definition

-   Finalize the product requirements document.
-   Define domain boundaries.
-   Agree on the core entity and state model.
-   Define household tenancy and permissions.
-   Map essential user workflows.
-   Record major architecture decisions.

### Phase 1 --- Platform foundation

-   Authentication.
-   Household tenancy and membership.
-   Locations and containers.
-   Core entity model.
-   Media storage.
-   Event history.
-   Notifications.

### Phase 2 --- Physical inventory

-   Products and inventory items.
-   Quantity and stock movements.
-   Scanning.
-   Shopping lists.
-   Low-stock rules.
-   Inventory history.

### Phase 3 --- Personal management

-   Activities and tasks.
-   Calendar events and routines.
-   Initial financial records.
-   Cross-domain overview.

### Phase 4 --- Connected environment

-   Home Assistant integration.
-   MQTT.
-   Local bridge.
-   Sensors and appliance state.
-   Device automation.

### Phase 5 --- Intelligence

-   Natural-language queries.
-   Image-assisted registration.
-   Recommendations.
-   Predictive replenishment.
-   Cross-domain optimization.

## 15. Existing products worth evaluating

NEXUS should reuse mature specialist systems where that makes sense. Its
value should come from the unified model and experience, not from
rebuilding every existing feature.

-   Home Assistant --- https://www.home-assistant.io/
-   Grocy --- https://grocy.info/
-   Homebox --- https://github.com/sysadminsmedia/homebox
-   Actual Budget --- https://actualbudget.org/
-   Mealie --- https://mealie.io/
-   Open Food Facts --- https://world.openfoodfacts.org/

Potential integration is not yet a commitment. Each system should be
evaluated for API quality, data ownership, maintenance burden, and how
well it fits NEXUS's model.

## 16. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Scope grows too quickly             Keep the MVP narrow and use
                                      explicit phase boundaries

  Inventory becomes inaccurate        Make updates fast, record history,
                                      and show confidence/provenance

  Data model becomes too generic      Keep domain concepts relational and
                                      explicit

  Cloud cannot reach local devices    Use a local bridge with
                                      authenticated outbound connectivity

  Internet outages disrupt home       Keep critical automation local and
  behavior                            queue synchronization

  Automation repeats or loops         Use idempotency, rate limits, and
                                      execution logs

  Private data leaks across members   Enforce authorization in the
                                      backend and test tenancy boundaries

  AI creates incorrect records        Treat AI output as a proposal and
                                      validate before consequential
                                      changes

  Integrations become hard to         Isolate adapters and define stable
  maintain                            internal contracts
  -----------------------------------------------------------------------

## 17. Open product decisions

These questions should be answered before the data model and permissions
are finalized:

1.  Can one household contain multiple properties?
2.  Can one member belong to multiple households?
3.  Which records are private, shared, or selectively shared?
4.  Is guest or temporary access required?
5.  Which quantity units and fractional quantities must be supported?
6.  Which events should be retained permanently?
7.  What is the expected offline reconciliation behavior?
8.  Which automation actions require approval?
9.  What are the export, deletion, backup, and restore requirements?

## 18. Recommended next specifications

The next documents should turn this product concept into
implementation-ready requirements.

### 18.1 Product Requirements Document (PRD)

Should define target users and personas, user stories and use cases,
functional and nonfunctional requirements, priorities and MVP
boundaries, and acceptance criteria.

### 18.2 Core Data Architecture

Should define the entity model and domain schemas, relationships and
cardinalities, state transitions, event contracts, household tenancy,
permissions and data visibility, database constraints, and migrations.

### 18.3 UX and Application Specification

Should define navigation and information architecture, dashboard
composition, module screens, mobile workflows, scanning interactions,
design system, and empty, loading, error, and offline states.

### 18.4 Recommended order of work

1.  Finalize the product definition and domain boundaries.
2.  Define household tenancy, members, and permissions.
3.  Design the core data model.
4.  Map inventory and scanning workflows.
5.  Design the main desktop and mobile experiences.
6.  Establish the repository and implement the platform foundation.

------------------------------------------------------------------------

## Closing perspective

The most important architectural decision is to build NEXUS around a
consistent model of the household and its state.

Inventory, activities, finances, and devices should not become unrelated
applications sharing only a navigation bar. They should be distinct
domains that can refer to the same people, places, objects, events, and
rules.

Start with a trustworthy system of record. Once NEXUS reliably knows
what exists, where it is, who it belongs to, and what has happened,
automation and intelligence can be layered on top without undermining
the data foundation.
