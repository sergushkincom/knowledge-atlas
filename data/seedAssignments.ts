import { notes } from '@/data/seed';
import type { Assignment, Topic } from '@/lib/types';
import { assignmentSchema, topicSchema } from '@/lib/types';

export const topics: Topic[] = [
  {
    id: 'topic-meetings',
    name: 'Meetings',
    description: 'Recurring syncs, workshops, and status notes from the team.',
    color: 'blue',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-one-on-ones',
    name: '1:1s',
    description: 'Notes from one-to-ones with teammates and managers.',
    color: 'purple',
    parentId: 'topic-meetings',
    origin: 'ai',
  },
  {
    id: 'topic-interviews',
    name: 'Interview prep',
    description: 'Role questions, stories, and notes on companies in the search.',
    color: 'orange',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-design',
    name: 'Design work',
    description: 'Case studies, critiques, and artifacts from product work.',
    color: 'pink',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-reading',
    name: 'Reading notes',
    description: 'Books, articles, and talks worth keeping.',
    color: 'yellow',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-health',
    name: 'Health & training',
    description: 'Running, gym, sleep, and physio logs.',
    color: 'green',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-life',
    name: 'Life admin',
    description: 'Car, money, home, and errands.',
    color: 'brown',
    parentId: null,
    origin: 'ai',
  },
  {
    id: 'topic-german',
    name: 'German',
    description: 'Vocabulary, grammar, and practice with Stefan.',
    color: 'teal',
    parentId: 'topic-life',
    origin: 'ai',
  },
  {
    id: 'topic-inbox',
    name: 'Unsorted',
    description: 'Notes without a reliable home. A person can drag them out.',
    color: 'gray',
    parentId: null,
    origin: 'ai',
    isInbox: true,
  },
];

const REASONS: Record<string, string> = {
  'topic-meetings': 'Reads as a team meeting: agenda, decisions, and follow-ups.',
  'topic-one-on-ones': 'A 1:1: one other person, updates, and a commitment.',
  'topic-interviews': 'Interview prep: a question, a story, or a company loop.',
  'topic-design': 'Design work: a case study, critique, or project artifact.',
  'topic-reading': 'A reading note: a book, article, or talk with takeaways.',
  'topic-health': 'Health and training: a plan, a log, or how the body felt.',
  'topic-life': 'Life admin: money, home, car, or an errand to close.',
  'topic-german': 'German practice: vocabulary, grammar, or a lesson.',
  'topic-inbox': 'Thin title and no clear home, so it stays in Unsorted.',
};

function vary(id: string): number {
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % 24;
  }
  return Math.round((0.72 + hash / 100) * 100) / 100;
}

function place(topicId: string, ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, topicId]));
}

const primary = {
  ...place('topic-meetings', [
    'note-sync-w05',
    'note-sync-w09',
    'note-sync-w13',
    'note-sync-w17',
    'note-sync-w21',
    'note-sync-w24',
    'note-sync-w28',
    'note-sync-w32',
    'note-sync-w36',
    'note-sync-w40',
    'note-retro-q1',
    'note-retro-q2',
    'note-planning-h2',
    'note-kickoff',
    'note-standup',
    'note-offsite',
    'note-incident',
    'note-roadmap',
    'note-stakeholders',
    'note-launch',
    'note-ru-sync',
    'note-de-sync',
    'note-workshop',
    'note-allhands',
  ]),
  ...place('topic-one-on-ones', [
    'note-11-maria',
    'note-11-maria-2',
    'note-11-arthur',
    'note-11-lena',
    'note-11-chris',
    'note-11-olga',
    'note-11-priya',
    'note-11-jonas',
    'note-11-kenji',
    'note-11-anna',
    'note-11-stefan',
    'note-11-noah',
    'note-11-elena',
    'note-11-de-lena',
    'note-11-ru-maria',
    'note-11-feedback',
    'note-11-goals',
  ]),
  ...place('topic-interviews', [
    'note-q-01',
    'note-q-03',
    'note-q-07',
    'note-q-12',
    'note-q-18',
    'note-q-21',
    'note-q-22',
    'note-story-onboarding',
    'note-story-search',
    'note-story-research',
    'note-company-northstar',
    'note-company-figment',
    'note-company-harbor',
    'note-questions',
    'note-portfolio',
    'note-de-interview',
    'note-ru-interview',
    'note-resume',
    'note-references',
  ]),
  ...place('topic-design', [
    'note-case-atlas',
    'note-case-checkout',
    'note-case-onboarding',
    'note-case-mobile',
    'note-process',
    'note-critique-principles',
    'note-typography',
    'note-journey',
    'note-ia',
    'note-prototype',
    'note-visual',
    'note-empty',
    'note-a11y',
    'note-de-design',
    'note-ru-design',
    'note-metrics',
  ]),
  ...place('topic-reading', [
    'note-book-doet',
    'note-book-shape',
    'note-talk-julie',
    'note-book-habits',
    'note-paper-tfidf',
    'note-newsletter',
  ]),
  ...place('topic-health', [
    'note-run-plan',
    'note-gym-log',
    'note-sleep',
    'note-physio',
    'note-mood',
  ]),
  ...place('topic-german', [
    'note-de-vocab',
    'note-de-cases',
    'note-de-practice',
    'note-de-exam',
  ]),
  ...place('topic-life', [
    'note-car-brakes',
    'note-insurance',
    'note-budget',
    'note-tax',
    'note-bike',
    'note-apartment',
    'note-dentist',
    'note-subscriptions',
    'note-moving',
    'note-de-invoice',
    'note-ru-budget',
  ]),
};

interface AmbiguousPlacement {
  topicId: string;
  secondaryTopicIds: string[];
  confidence: number;
  reason: string;
}

export const AMBIGUOUS_NOTE_IDS = [
  'note-untitled-1',
  'note-untitled-2',
  'note-11-untitled',
  'note-untitled-interview',
  'note-design-crit',
  'note-design-crit-2',
  'note-hiring-sync',
  'note-brainstorm',
  'note-mock',
  'note-debrief',
  'note-q-14',
  'note-comp',
  'note-research-interviews',
  'note-handoff',
  'note-article-ai',
  'note-article-graph',
  'note-flight',
  'note-de-health',
] as const;

const ambiguous: Record<string, AmbiguousPlacement> = {
  'note-untitled-1': {
    topicId: 'topic-inbox',
    secondaryTopicIds: ['topic-meetings'],
    confidence: 0.33,
    reason: 'Untitled fragment that mentions a standup, but never says which meeting.',
  },
  'note-untitled-2': {
    topicId: 'topic-inbox',
    secondaryTopicIds: ['topic-reading'],
    confidence: 0.36,
    reason: 'A few loose sentences that could be a reading note or just a scratch.',
  },
  'note-11-untitled': {
    topicId: 'topic-inbox',
    secondaryTopicIds: ['topic-one-on-ones'],
    confidence: 0.42,
    reason: 'Sounds like a 1:1, but the note never names who was in the room.',
  },
  'note-untitled-interview': {
    topicId: 'topic-inbox',
    secondaryTopicIds: ['topic-interviews'],
    confidence: 0.39,
    reason: 'Draft answers with no company and no question number.',
  },
  'note-design-crit': {
    topicId: 'topic-meetings',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.48,
    reason: 'A meeting note, but most of the time is spent on a design critique.',
  },
  'note-design-crit-2': {
    topicId: 'topic-meetings',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.51,
    reason: 'Scheduled as a meeting; the content is an onboarding design review.',
  },
  'note-hiring-sync': {
    topicId: 'topic-meetings',
    secondaryTopicIds: ['topic-interviews'],
    confidence: 0.46,
    reason: 'A hiring meeting that is also interview-loop planning.',
  },
  'note-brainstorm': {
    topicId: 'topic-meetings',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.44,
    reason: 'Team brainstorm that is half meeting, half a design exploration.',
  },
  'note-mock': {
    topicId: 'topic-interviews',
    secondaryTopicIds: ['topic-one-on-ones'],
    confidence: 0.55,
    reason: 'Mock interview with Arthur — a prep session and a 1:1 at once.',
  },
  'note-debrief': {
    topicId: 'topic-interviews',
    secondaryTopicIds: ['topic-meetings'],
    confidence: 0.52,
    reason: 'Interview debrief written up like meeting notes.',
  },
  'note-q-14': {
    topicId: 'topic-interviews',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.49,
    reason: 'An interview question about running a design critique.',
  },
  'note-comp': {
    topicId: 'topic-interviews',
    secondaryTopicIds: ['topic-life'],
    confidence: 0.41,
    reason: 'Compensation notes for the search, overlapping personal finances.',
  },
  'note-research-interviews': {
    topicId: 'topic-design',
    secondaryTopicIds: ['topic-interviews'],
    confidence: 0.47,
    reason: 'User interviews for a design study, easy to confuse with job interviews.',
  },
  'note-handoff': {
    topicId: 'topic-design',
    secondaryTopicIds: ['topic-meetings'],
    confidence: 0.53,
    reason: 'Eng handoff notes that read as both a design spec and a meeting.',
  },
  'note-article-ai': {
    topicId: 'topic-reading',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.45,
    reason: 'Article notes on clustering, relevant to design work and to reading.',
  },
  'note-article-graph': {
    topicId: 'topic-reading',
    secondaryTopicIds: ['topic-design'],
    confidence: 0.5,
    reason: 'Reading note about graph layout, aimed at the Atlas design project.',
  },
  'note-flight': {
    topicId: 'topic-life',
    secondaryTopicIds: ['topic-meetings'],
    confidence: 0.43,
    reason: 'Trip logistics for the offsite, so it is both life admin and a meeting.',
  },
  'note-de-health': {
    topicId: 'topic-health',
    secondaryTopicIds: ['topic-german'],
    confidence: 0.54,
    reason: 'A training plan written in German, so health and language study both fit.',
  },
};

function buildAssignments(): Assignment[] {
  return notes.map((note) => {
    const special = ambiguous[note.id];
    if (special) {
      return {
        noteId: note.id,
        topicId: special.topicId,
        secondaryTopicIds: special.secondaryTopicIds,
        confidence: special.confidence,
        reason: special.reason,
        origin: 'ai' as const,
        locked: false,
      };
    }
    const topicId = primary[note.id as keyof typeof primary];
    if (!topicId) {
      throw new Error(`No assignment for ${note.id}`);
    }
    const reason = REASONS[topicId];
    if (!reason) {
      throw new Error(`No reason for ${topicId}`);
    }
    return {
      noteId: note.id,
      topicId,
      secondaryTopicIds: [],
      confidence: vary(note.id),
      reason,
      origin: 'ai' as const,
      locked: false,
    };
  });
}

export const assignments: Assignment[] = assignmentSchema.array().parse(buildAssignments());

topicSchema.array().parse(topics);

const topicIds = new Set(topics.map((topic) => topic.id));
for (const assignment of assignments) {
  if (!topicIds.has(assignment.topicId)) {
    throw new Error(`Assignment ${assignment.noteId} points at missing topic`);
  }
  for (const secondary of assignment.secondaryTopicIds) {
    if (!topicIds.has(secondary)) {
      throw new Error(`Secondary topic missing for ${assignment.noteId}`);
    }
  }
}
