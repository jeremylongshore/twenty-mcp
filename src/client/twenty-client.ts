import { GraphQLClient } from 'graphql-request';
import { TwentyConfig, Person, Company, Task, Note, SearchOptions } from '../types/twenty.js';
import { Opportunity, CreateOpportunityInput, UpdateOpportunityInput, SearchOpportunitiesInput } from '../types/opportunities.js';
import { Activity, Comment, CreateCommentInput, ActivityFilter, EntityActivitiesInput, ActivityTimeline } from '../types/activities.js';
import { ObjectMetadata, FieldMetadata, ObjectSchema, ObjectSummary, MetadataQueryOptions, FieldQueryOptions } from '../types/metadata.js';
import { 
  RelationshipSummary, 
  CompanyContactsResult, 
  PersonOpportunitiesResult, 
  OpportunityActivitiesResult,
  RelationshipHierarchy,
  OrphanedRecords,
  LinkOpportunityInput,
  TransferContactInput,
  BulkRelationshipUpdate
} from '../types/relationships.js';

export class TwentyClient {
  private client: GraphQLClient;
  // Twenty exposes two separate GraphQL endpoints: /graphql (data: companies,
  // people, opportunities, ...) and /metadata (object/field schema
  // introspection). Metadata queries 404/type-error against /graphql — they
  // must go through this second client. See jezweb/twenty-mcp#35.
  private metadataClient: GraphQLClient;
  private baseUrl: string;

  constructor(config: TwentyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.twenty.com';
    const headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
    this.client = new GraphQLClient(`${this.baseUrl}/graphql`, { headers });
    this.metadataClient = new GraphQLClient(`${this.baseUrl}/metadata`, { headers });
  }

  async createPerson(person: Person): Promise<Person> {
    const mutation = `
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
          phones {
            primaryPhoneNumber
            primaryPhoneCountryCode
          }
          companyId
          jobTitle
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          city
          avatarUrl
        }
      }
    `;

    const result = await this.client.request(mutation, { data: person }) as { createPerson: Person };
    return result.createPerson;
  }

  async getPerson(id: string): Promise<Person> {
    const query = `
      query GetPerson($filter: PersonFilterInput!) {
        people(filter: $filter) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
                primaryPhoneCountryCode
              }
              companyId
              jobTitle
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              city
              avatarUrl
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { people: { edges: { node: Person }[] } };
    return result.people.edges[0]?.node;
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
    const mutation = `
      mutation UpdatePerson($id: UUID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
          phones {
            primaryPhoneNumber
            primaryPhoneCountryCode
          }
          companyId
          jobTitle
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          city
          avatarUrl
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data: updates }) as { updatePerson: Person };
    return result.updatePerson;
  }

  async searchPeople(query: string, options: SearchOptions = {}): Promise<Person[]> {
    const searchQuery = `
      query SearchPeople($filter: PersonFilterInput, $first: Int, $after: String) {
        people(filter: $filter, first: $first, after: $after) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
                primaryPhoneCountryCode
              }
              companyId
              jobTitle
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              city
              avatarUrl
            }
          }
        }
      }
    `;

    const filter = {
      or: [
        { name: { firstName: { ilike: `%${query}%` } } },
        { name: { lastName: { ilike: `%${query}%` } } },
        { emails: { primaryEmail: { ilike: `%${query}%` } } }
      ]
    };

    const result = await this.client.request(searchQuery, {
      filter,
      first: options.limit || 20,
    }) as { people: { edges: { node: Person }[] } };

    return result.people.edges.map(edge => edge.node);
  }

  async createCompany(company: Company): Promise<Company> {
    const mutation = `
      mutation CreateCompany($data: CompanyCreateInput!) {
        createCompany(data: $data) {
          id
          name
          domainName {
            primaryLinkUrl
            primaryLinkLabel
          }
          address {
            addressStreet1
            addressCity
            addressState
            addressCountry
            addressPostcode
          }
          employees
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          xLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          annualRecurringRevenue {
            amountMicros
            currencyCode
          }
          idealCustomerProfile
        }
      }
    `;

    const result = await this.client.request(mutation, { data: company }) as { createCompany: Company };
    return result.createCompany;
  }

  async getCompany(id: string): Promise<Company> {
    const query = `
      query GetCompany($filter: CompanyFilterInput!) {
        companies(filter: $filter) {
          edges {
            node {
              id
              name
              domainName {
                primaryLinkUrl
                primaryLinkLabel
              }
              address {
                addressStreet1
                addressCity
                addressState
                addressCountry
                addressPostcode
              }
              employees
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              xLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              annualRecurringRevenue {
                amountMicros
                currencyCode
              }
              idealCustomerProfile
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { companies: { edges: { node: Company }[] } };
    return result.companies.edges[0]?.node;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const mutation = `
      mutation UpdateCompany($id: UUID!, $data: CompanyUpdateInput!) {
        updateCompany(id: $id, data: $data) {
          id
          name
          domainName {
            primaryLinkUrl
            primaryLinkLabel
          }
          address {
            addressStreet1
            addressCity
            addressState
            addressCountry
            addressPostcode
          }
          employees
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          xLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          annualRecurringRevenue {
            amountMicros
            currencyCode
          }
          idealCustomerProfile
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data: updates }) as { updateCompany: Company };
    return result.updateCompany;
  }

  async searchCompanies(query: string, options: SearchOptions = {}): Promise<Company[]> {
    const searchQuery = `
      query SearchCompanies($filter: CompanyFilterInput, $first: Int, $after: String) {
        companies(filter: $filter, first: $first, after: $after) {
          edges {
            node {
              id
              name
              domainName {
                primaryLinkUrl
                primaryLinkLabel
              }
              address {
                addressStreet1
                addressCity
                addressState
                addressCountry
                addressPostcode
              }
              employees
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              xLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              annualRecurringRevenue {
                amountMicros
                currencyCode
              }
              idealCustomerProfile
            }
          }
        }
      }
    `;

    const filter = {
      or: [
        { name: { ilike: `%${query}%` } },
        { domainName: { primaryLinkUrl: { ilike: `%${query}%` } } }
      ]
    };

    const result = await this.client.request(searchQuery, {
      filter,
      first: options.limit || 20,
    }) as { companies: { edges: { node: Company }[] } };

    return result.companies.edges.map(edge => edge.node);
  }

  async createTask(task: Task): Promise<Task> {
    // Twenty v2 schema: body (String) → bodyV2 (RichTextCreateInput { markdown }).
    // Keep the external interface flat; translate at the boundary.
    const { body, ...rest } = task;
    const data: Record<string, unknown> = { ...rest };
    if (body !== undefined) {
      data.bodyV2 = { markdown: body };
    }

    const mutation = `
      mutation CreateTask($data: TaskCreateInput!) {
        createTask(data: $data) {
          id
          title
          bodyV2 { markdown }
          dueAt
          status
          assigneeId
        }
      }
    `;

    const result = await this.client.request(mutation, { data }) as {
      createTask: Omit<Task, 'body'> & { bodyV2?: { markdown?: string } | null };
    };
    const { bodyV2, ...task_out } = result.createTask;
    return { ...task_out, body: bodyV2?.markdown ?? undefined } as Task;
  }

  async getTasks(options: SearchOptions = {}): Promise<Task[]> {
    const query = `
      {
        tasks {
          edges {
            node {
              id
              title
              bodyV2 { markdown }
              status
            }
          }
        }
      }
    `;

    const result = await this.client.request(query) as {
      tasks: { edges: { node: Omit<Task, 'body'> & { bodyV2?: { markdown?: string } | null } }[] };
    };

    return result.tasks.edges.map(edge => {
      const { bodyV2, ...node } = edge.node;
      return { ...node, body: bodyV2?.markdown ?? undefined } as Task;
    });
  }

  async createNote(note: Note): Promise<Note> {
    // Twenty v2 schema: body (String) → bodyV2 (RichTextCreateInput { markdown }).
    // authorId is no longer on NoteCreateInput; createdBy is an ActorCreateInput
    // we don't synthesize here (server stamps from API key context).
    const { body, authorId, ...rest } = note;
    const data: Record<string, unknown> = {
      ...rest,
      bodyV2: { markdown: body },
    };

    const mutation = `
      mutation CreateNote($data: NoteCreateInput!) {
        createNote(data: $data) {
          id
          title
          bodyV2 { markdown }
        }
      }
    `;

    const result = await this.client.request(mutation, { data }) as {
      createNote: { id: string; title?: string; bodyV2?: { markdown?: string } | null };
    };
    const created = result.createNote;
    return {
      id: created.id,
      title: created.title,
      body: created.bodyV2?.markdown ?? '',
      authorId,
    } as Note;
  }

  async createOpportunity(opportunity: CreateOpportunityInput): Promise<Opportunity> {
    const mutation = `
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          closeDate
          companyId
          pointOfContactId
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.client.request(mutation, { data: opportunity }) as { createOpportunity: Opportunity };
    return result.createOpportunity;
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    const query = `
      query GetOpportunity($filter: OpportunityFilterInput!) {
        opportunities(filter: $filter) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { opportunities: { edges: { node: Opportunity }[] } };
    return result.opportunities.edges[0]?.node;
  }

  async updateOpportunity(input: UpdateOpportunityInput): Promise<Opportunity> {
    const { id, ...data } = input;
    const mutation = `
      mutation UpdateOpportunity($id: UUID!, $data: OpportunityUpdateInput!) {
        updateOpportunity(id: $id, data: $data) {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          closeDate
          companyId
          pointOfContactId
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data }) as { updateOpportunity: Opportunity };
    return result.updateOpportunity;
  }

  async searchOpportunities(input: SearchOpportunitiesInput): Promise<Opportunity[]> {
    const query = `
      query SearchOpportunities($filter: OpportunityFilterInput, $first: Int) {
        opportunities(filter: $filter, first: $first) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const filters: any = {};
    
    if (input.query) {
      filters.name = { ilike: `%${input.query}%` };
    }
    
    if (input.stage) {
      filters.stage = { eq: input.stage };
    }
    
    if (input.companyId) {
      filters.companyId = { eq: input.companyId };
    }
    
    if (input.startDate || input.endDate) {
      filters.closeDate = {};
      if (input.startDate) filters.closeDate.gte = input.startDate;
      if (input.endDate) filters.closeDate.lte = input.endDate;
    }
    
    if (input.minAmount || input.maxAmount) {
      filters.amount = { amountMicros: {} };
      if (input.minAmount) filters.amount.amountMicros.gte = input.minAmount * 1000000;
      if (input.maxAmount) filters.amount.amountMicros.lte = input.maxAmount * 1000000;
    }

    // Twenty uses cursor pagination (first/after), not offset — `input.offset`
    // has no server-side equivalent here and is intentionally not sent.
    const result = await this.client.request(query, {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      first: input.limit || 20,
    }) as { opportunities: { edges: { node: Opportunity }[] } };

    return result.opportunities.edges.map(edge => edge.node);
  }

  async listOpportunitiesByStage(): Promise<Record<string, Opportunity[]>> {
    const query = `
      query ListAllOpportunities {
        opportunities(first: 100) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query) as { opportunities: { edges: { node: Opportunity }[] } };
    const opportunities = result.opportunities.edges.map(edge => edge.node);
    
    // Group by stage
    const groupedByStage: Record<string, Opportunity[]> = {};
    opportunities.forEach(opp => {
      const stage = opp.stage || 'No Stage';
      if (!groupedByStage[stage]) {
        groupedByStage[stage] = [];
      }
      groupedByStage[stage].push(opp);
    });
    
    return groupedByStage;
  }

  async getActivities(filter?: ActivityFilter): Promise<ActivityTimeline> {
    // Get both tasks and notes as activities
    const tasksQuery = `
      query GetTasks($first: Int) {
        tasks(first: $first, orderBy: { createdAt: DescNullsLast }) {
          edges {
            node {
              id
              title
              bodyV2 { markdown }
              status
              dueAt
              assigneeId
              assignee {
                id
                name {
                  firstName
                  lastName
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const notesQuery = `
      query GetNotes($first: Int) {
        notes(first: $first, orderBy: { createdAt: DescNullsLast }) {
          edges {
            node {
              id
              title
              bodyV2 { markdown }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const limit = filter?.limit || 20;

    const [tasksResult, notesResult] = await Promise.all([
      this.client.request(tasksQuery, { first: limit }),
      this.client.request(notesQuery, { first: limit })
    ]);
    
    const typedTasksResult = tasksResult as { tasks: { edges: { node: any }[] } };
    const typedNotesResult = notesResult as { notes: { edges: { node: any }[] } };

    // Transform and combine activities
    const activities: Activity[] = [];

    typedTasksResult.tasks.edges.forEach(edge => {
      const task = edge.node;
      activities.push({
        id: task.id,
        type: 'task',
        title: task.title,
        body: task.bodyV2?.markdown,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        authorId: task.assigneeId,
        author: task.assignee
      });
    });

    typedNotesResult.notes.edges.forEach(edge => {
      const note = edge.node;
      activities.push({
        id: note.id,
        type: 'note',
        title: note.title,
        body: note.bodyV2?.markdown,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        authorId: undefined,
        author: undefined
      });
    });

    // Sort by creation date (newest first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply filters
    let filteredActivities = activities;
    
    if (filter?.type && filter.type.length > 0) {
      filteredActivities = filteredActivities.filter(activity => filter.type!.includes(activity.type));
    }
    
    if (filter?.dateFrom) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.createdAt) >= new Date(filter.dateFrom!)
      );
    }
    
    if (filter?.dateTo) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.createdAt) <= new Date(filter.dateTo!)
      );
    }
    
    if (filter?.authorId) {
      filteredActivities = filteredActivities.filter(activity => activity.authorId === filter.authorId);
    }

    return {
      activities: filteredActivities,
      totalCount: filteredActivities.length,
      hasMore: filteredActivities.length === limit
    };
  }

  async filterActivities(filter: ActivityFilter): Promise<Activity[]> {
    const timeline = await this.getActivities(filter);
    return timeline.activities;
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    // Twenty v2 schema removed the standalone Comment model. Comments on
    // CRM records are now Notes with a NoteTarget linking the Note to a
    // company / person / opportunity. We preserve the external interface
    // (body + targetObjectId/Type) and translate at the boundary.
    //
    // Two-step:
    //   1. createNote with bodyV2.markdown
    //   2. createNoteTarget linking the new noteId to the target

    const createNoteMutation = `
      mutation CreateNote($data: NoteCreateInput!) {
        createNote(data: $data) {
          id
          createdAt
          updatedAt
          bodyV2 { markdown }
        }
      }
    `;
    const noteResult = await this.client.request(createNoteMutation, {
      data: { bodyV2: { markdown: input.body } },
    }) as { createNote: { id: string; createdAt: string; updatedAt: string; bodyV2?: { markdown?: string } | null } };
    const note = noteResult.createNote;

    const targetType = input.targetObjectNameSingular;
    const targetId = input.targetObjectId;
    if (targetType && targetId) {
      const targetFieldByType: Record<string, string> = {
        company: 'targetCompanyId',
        person: 'targetPersonId',
        opportunity: 'targetOpportunityId',
      };
      const targetField = targetFieldByType[targetType];
      if (!targetField) {
        throw new Error(
          `Unsupported targetObjectType for comment: "${targetType}" — expected one of: company, person, opportunity.`
        );
      }
      const createNoteTargetMutation = `
        mutation CreateNoteTarget($data: NoteTargetCreateInput!) {
          createNoteTarget(data: $data) {
            id
          }
        }
      `;
      await this.client.request(createNoteTargetMutation, {
        data: { noteId: note.id, [targetField]: targetId },
      });
    }

    return {
      id: note.id,
      body: note.bodyV2?.markdown ?? input.body,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      authorId: input.authorId,
      activityTargetId: input.activityTargetId,
    } as Comment;
  }

  async getEntityActivities(input: EntityActivitiesInput): Promise<ActivityTimeline> {
    // Notes/Tasks link to a company/person/opportunity via NoteTarget/TaskTarget
    // join records (same shape createComment() uses). Query those directly
    // instead of fetching all activities and filtering client-side.
    const targetFieldByType: Record<string, string> = {
      company: 'targetCompanyId',
      person: 'targetPersonId',
      opportunity: 'targetOpportunityId',
    };
    const targetField = targetFieldByType[input.entityType];
    if (!targetField) {
      throw new Error(
        `Unsupported entityType for getEntityActivities: "${input.entityType}" — expected one of: company, person, opportunity.`
      );
    }

    const limit = input.limit || 20;

    const noteTargetsQuery = `
      query GetEntityNoteTargets($filter: NoteTargetFilterInput, $first: Int) {
        noteTargets(filter: $filter, first: $first) {
          edges {
            node {
              note {
                id
                title
                bodyV2 { markdown }
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;

    const taskTargetsQuery = `
      query GetEntityTaskTargets($filter: TaskTargetFilterInput, $first: Int) {
        taskTargets(filter: $filter, first: $first) {
          edges {
            node {
              task {
                id
                title
                bodyV2 { markdown }
                status
                dueAt
                assigneeId
                assignee {
                  id
                  name { firstName lastName }
                }
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;

    const filter = { [targetField]: { eq: input.entityId } };

    const [noteTargetsResult, taskTargetsResult] = await Promise.all([
      this.client.request(noteTargetsQuery, { filter, first: limit }),
      this.client.request(taskTargetsQuery, { filter, first: limit }),
    ]);

    const typedNoteTargets = noteTargetsResult as { noteTargets: { edges: { node: { note: any } }[] } };
    const typedTaskTargets = taskTargetsResult as { taskTargets: { edges: { node: { task: any } }[] } };

    const activities: Activity[] = [];

    typedNoteTargets.noteTargets.edges.forEach(edge => {
      const note = edge.node.note;
      activities.push({
        id: note.id,
        type: 'note',
        title: note.title,
        body: note.bodyV2?.markdown,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        authorId: undefined,
        author: undefined,
      });
    });

    typedTaskTargets.taskTargets.edges.forEach(edge => {
      const task = edge.node.task;
      activities.push({
        id: task.id,
        type: 'task',
        title: task.title,
        body: task.bodyV2?.markdown,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        authorId: task.assigneeId,
        author: task.assignee,
      });
    });

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      activities,
      totalCount: activities.length,
      hasMore: activities.length === limit * 2,
    };
  }

  async listAllObjects(options: MetadataQueryOptions = {}): Promise<ObjectSummary> {
    const query = `
      query GetObjectMetadata {
        objects {
          edges {
            node {
              id
              nameSingular
              namePlural
              labelSingular
              labelPlural
              description
              icon
              isCustom
              isActive
              isSystem
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.metadataClient.request(query) as { objects: { edges: { node: ObjectMetadata }[] } };
    const allObjects = result.objects.edges.map(edge => edge.node);

    // Filter based on options
    let filteredObjects = allObjects;
    
    if (options.activeOnly !== false) {
      filteredObjects = filteredObjects.filter(obj => obj.isActive);
    }
    
    if (options.includeCustom === false) {
      filteredObjects = filteredObjects.filter(obj => !obj.isCustom);
    }
    
    if (options.includeSystem === false) {
      filteredObjects = filteredObjects.filter(obj => !obj.isSystem);
    }

    // Group objects by type
    const standard = filteredObjects.filter(obj => !obj.isCustom && !obj.isSystem);
    const custom = filteredObjects.filter(obj => obj.isCustom);
    const system = filteredObjects.filter(obj => obj.isSystem);

    return {
      standard,
      custom,
      system,
      totalCount: filteredObjects.length,
      standardCount: standard.length,
      customCount: custom.length,
      systemCount: system.length
    };
  }

  async getObjectSchema(objectNameOrId: string): Promise<ObjectSchema> {
    // ObjectFilter (the /metadata endpoint's filter input) only exposes
    // id/isCustom/isActive/isRemote/isSystem/isUIReadOnly/isSearchable —
    // there is no nameSingular/namePlural filter field. A UUID can filter
    // server-side by id; a name has to fetch (the small, unpaginated) full
    // object list and match client-side. See jezweb/twenty-mcp#35.
    const isUuid = objectNameOrId.match(/^[0-9a-fA-F-]{36}$/);

    const fieldsSelection = `
      id
      name
      label
      description
      type
      isCustom
      isActive
      isNullable
      isSystem
      defaultValue
      createdAt
      updatedAt
    `;

    const objectQuery = isUuid
      ? `
        query GetObjectSchemaById($filter: ObjectFilter!) {
          objects(filter: $filter) {
            edges {
              node {
                id
                nameSingular
                namePlural
                labelSingular
                labelPlural
                description
                icon
                isCustom
                isActive
                isSystem
                createdAt
                updatedAt
                fields { edges { node { ${fieldsSelection} } } }
              }
            }
          }
        }
      `
      : `
        query GetAllObjectSchemas {
          objects {
            edges {
              node {
                id
                nameSingular
                namePlural
                labelSingular
                labelPlural
                description
                icon
                isCustom
                isActive
                isSystem
                createdAt
                updatedAt
                fields { edges { node { ${fieldsSelection} } } }
              }
            }
          }
        }
      `;

    const variables = isUuid ? { filter: { id: { eq: objectNameOrId } } } : {};

    const result = await this.metadataClient.request(objectQuery, variables) as {
      objects: {
        edges: {
          node: ObjectMetadata & {
            fields: { edges: { node: FieldMetadata }[] }
          }
        }[]
      }
    };

    if (!isUuid) {
      result.objects.edges = result.objects.edges.filter(
        edge => edge.node.nameSingular === objectNameOrId || edge.node.namePlural === objectNameOrId
      );
    }

    if (result.objects.edges.length === 0) {
      throw new Error(`Object not found: ${objectNameOrId}`);
    }

    const objectNode = result.objects.edges[0].node;
    const fields = objectNode.fields.edges.map(edge => edge.node);

    return {
      object: {
        id: objectNode.id,
        nameSingular: objectNode.nameSingular,
        namePlural: objectNode.namePlural,
        labelSingular: objectNode.labelSingular,
        labelPlural: objectNode.labelPlural,
        description: objectNode.description,
        icon: objectNode.icon,
        isCustom: objectNode.isCustom,
        isActive: objectNode.isActive,
        isSystem: objectNode.isSystem,
        createdAt: objectNode.createdAt,
        updatedAt: objectNode.updatedAt,
        fields
      },
      fields,
      relationships: [] // TODO: Implement relationship discovery
    };
  }

  async getFieldMetadata(options: FieldQueryOptions = {}): Promise<FieldMetadata[]> {
    let query: string;
    let variables: any = {};

    if (options.objectId || options.objectName) {
      // ObjectFilter has no name field (only id/isCustom/isActive/isRemote/
      // isSystem/isUIReadOnly/isSearchable) — a name lookup fetches all
      // objects (small, unpaginated list) and matches client-side; an id
      // lookup filters server-side. See jezweb/twenty-mcp#35.
      const fieldSelection = `
        id
        name
        label
        description
        type
        isCustom
        isActive
        isNullable
        isSystem
        defaultValue
        createdAt
        updatedAt
      `;

      if (options.objectId) {
        query = `
          query GetFieldsForObjectById($filter: ObjectFilter!) {
            objects(filter: $filter) {
              edges { node { nameSingular namePlural fields { edges { node { ${fieldSelection} } } } } }
            }
          }
        `;
        variables.filter = { id: { eq: options.objectId } };
      } else {
        query = `
          query GetFieldsForAllObjects {
            objects {
              edges { node { nameSingular namePlural fields { edges { node { ${fieldSelection} } } } } }
            }
          }
        `;
      }
    } else {
      // Get all fields across all objects
      query = `
        query GetAllFields {
          fields {
            edges {
              node {
                id
                name
                label
                description
                type
                isCustom
                isActive
                isNullable
                isSystem
                defaultValue
                createdAt
                updatedAt
              }
            }
          }
        }
      `;
    }

    const result = await this.metadataClient.request(query, variables) as any;

    let fields: FieldMetadata[];

    if (options.objectId || options.objectName) {
      let objectEdges = result.objects.edges;
      if (options.objectName) {
        objectEdges = objectEdges.filter((edge: any) =>
          edge.node.nameSingular === options.objectName || edge.node.namePlural === options.objectName
        );
      }
      if (objectEdges.length === 0) {
        throw new Error(`Object not found: ${options.objectId || options.objectName}`);
      }
      fields = objectEdges[0].node.fields.edges.map((edge: any) => edge.node);
    } else {
      fields = result.fields.edges.map((edge: any) => edge.node);
    }

    // Apply filters
    let filteredFields = fields;
    
    if (options.activeOnly !== false) {
      filteredFields = filteredFields.filter(field => field.isActive);
    }
    
    if (options.includeCustom === false) {
      filteredFields = filteredFields.filter(field => !field.isCustom);
    }
    
    if (options.includeSystem === false) {
      filteredFields = filteredFields.filter(field => !field.isSystem);
    }
    
    if (options.fieldType) {
      filteredFields = filteredFields.filter(field => field.type === options.fieldType);
    }

    return filteredFields;
  }

  // Relationship Management Methods

  async getCompanyContacts(companyId: string): Promise<CompanyContactsResult> {
    const query = `
      query GetCompanyContacts($companyId: UUID!) {
        company(filter: { id: { eq: $companyId } }) {
          id
          name
        }
        people(filter: { companyId: { eq: $companyId } }, first: 100) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
              }
              jobTitle
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { companyId }) as any;
    
    const contacts = result.people.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      email: edge.node.emails?.primaryEmail,
      phone: edge.node.phones?.primaryPhoneNumber,
      jobTitle: edge.node.jobTitle,
      createdAt: edge.node.createdAt
    }));

    return {
      companyId,
      companyName: result.company?.name || 'Unknown Company',
      contacts,
      totalContacts: contacts.length
    };
  }

  async getPersonOpportunities(personId: string): Promise<PersonOpportunitiesResult> {
    const query = `
      query GetPersonOpportunities($personId: UUID!) {
        person(filter: { id: { eq: $personId } }) {
          id
          name {
            firstName
            lastName
          }
        }
        opportunities(filter: { pointOfContactId: { eq: $personId } }, first: 100) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              company {
                id
                name
              }
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { personId }) as any;
    
    const opportunities = result.opportunities.edges.map((edge: any) => edge.node);
    const person = result.person;

    return {
      personId,
      personName: person ? `${person.name.firstName} ${person.name.lastName}` : 'Unknown Person',
      opportunities,
      totalOpportunities: opportunities.length
    };
  }

  async linkOpportunityToCompany(input: LinkOpportunityInput): Promise<any> {
    const mutation = `
      mutation LinkOpportunity($id: UUID!, $data: OpportunityUpdateInput!) {
        updateOpportunity(id: $id, data: $data) {
          id
          name
          companyId
          pointOfContactId
          company {
            id
            name
          }
          pointOfContact {
            id
            name {
              firstName
              lastName
            }
          }
        }
      }
    `;

    const updateData: any = {};
    if (input.companyId) updateData.companyId = input.companyId;
    if (input.pointOfContactId) updateData.pointOfContactId = input.pointOfContactId;

    const result = await this.client.request(mutation, {
      id: input.opportunityId,
      data: updateData
    }) as { updateOpportunity: any };

    return result.updateOpportunity;
  }

  async transferContactToCompany(input: TransferContactInput): Promise<any> {
    const mutation = `
      mutation TransferContact($id: UUID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          name {
            firstName
            lastName
          }
          companyId
          company {
            id
            name
          }
        }
      }
    `;

    const result = await this.client.request(mutation, {
      id: input.contactId,
      data: { companyId: input.toCompanyId }
    }) as { updatePerson: any };

    return result.updatePerson;
  }

  async getRelationshipSummary(entityId: string, entityType: string): Promise<RelationshipSummary> {
    let counts = {
      companies: 0,
      contacts: 0,
      opportunities: 0,
      tasks: 0,
      activities: 0
    };

    try {
      switch (entityType.toLowerCase()) {
        case 'company':
          // Get contacts for this company
          const companyContacts = await this.getCompanyContacts(entityId);
          counts.contacts = companyContacts.totalContacts;
          
          // Get opportunities for this company
          const companyOpps = await this.searchOpportunities({ companyId: entityId, limit: 1000 });
          counts.opportunities = companyOpps.length;
          break;
          
        case 'person':
          // Get opportunities for this person
          const personOpps = await this.getPersonOpportunities(entityId);
          counts.opportunities = personOpps.totalOpportunities;
          
          // Get tasks assigned to this person (would need a specific query for filtering)
          // For now, we'll skip task counting as it requires a filtered query
          counts.tasks = 0;
          break;
      }
    } catch (error) {
      console.warn('Error calculating relationship summary:', error);
    }

    return {
      entityId,
      entityType,
      relationships: counts
    };
  }

  async findOrphanedRecords(): Promise<OrphanedRecords> {
    const orphaned: OrphanedRecords = {
      companies: [],
      contacts: [],
      opportunities: [],
      tasks: []
    };

    try {
      // Find companies with no contacts
      const companiesQuery = `
        query GetCompaniesWithContacts {
          companies(first: 1000) {
            edges {
              node {
                id
                name
                people {
                  totalCount
                }
                opportunities {
                  totalCount
                }
              }
            }
          }
        }
      `;

      const companiesResult = await this.client.request(companiesQuery) as any;
      orphaned.companies = companiesResult.companies.edges
        .map((edge: any) => edge.node)
        .filter((company: any) => company.people.totalCount === 0)
        .map((company: any) => ({
          id: company.id,
          name: company.name,
          contactCount: 0,
          opportunityCount: company.opportunities.totalCount
        }));

      // Find contacts without companies
      const contactsQuery = `
        query GetContactsWithoutCompanies {
          people(filter: { companyId: { is: NULL } }, first: 1000) {
            edges {
              node {
                id
                name {
                  firstName
                  lastName
                }
                companyId
                opportunities {
                  totalCount
                }
              }
            }
          }
        }
      `;

      const contactsResult = await this.client.request(contactsQuery) as any;
      orphaned.contacts = contactsResult.people.edges.map((edge: any) => ({
        id: edge.node.id,
        name: `${edge.node.name.firstName} ${edge.node.name.lastName}`,
        hasCompany: !!edge.node.companyId,
        opportunityCount: edge.node.opportunities.totalCount
      }));

    } catch (error) {
      console.warn('Error finding orphaned records:', error);
    }

    return orphaned;
  }
}