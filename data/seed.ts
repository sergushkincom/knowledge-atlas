import type { Note, NoteSource } from '@/lib/types';
import { noteSchema } from '@/lib/types';

/** Fixed "today" so dates stay inside the last nine months of the demo. */
export const SEED_ANCHOR = '2026-10-08T12:00:00.000Z';
const ANCHOR_MS = Date.parse(SEED_ANCHOR);
const DAY_MS = 24 * 60 * 60 * 1000;

export const ORPHAN_IDS = [
  'note-untitled-1',
  'note-untitled-2',
  'note-11-untitled',
  'note-resume',
  'note-paper-tfidf',
  'note-mood',
  'note-bike',
  'note-apartment',
  'note-dentist',
  'note-subscriptions',
] as const;

export const NON_ENGLISH_TITLES: Record<string, string> = {
  'note-ru-sync': 'Еженедельный синк 18.02',
  'note-de-sync': 'Wochenmeeting 07.09',
  'note-11-de-lena': 'Gespräch mit Lena',
  'note-11-ru-maria': '1:1 с Марией',
  'note-de-interview': 'Vorbereitung Gespräch 12.05',
  'note-ru-interview': 'Подготовка к интервью',
  'note-de-design': 'Fallstudie: Checkout',
  'note-ru-design': 'Кейс: онбординг',
  'note-book-habits': 'Lesenotizen: Atomic Habits',
  'note-de-health': 'Trainingsplan Oktober',
  'note-de-vocab': 'Vokabeln Woche 12',
  'note-de-invoice': 'Rechnung Werkstatt',
};

interface Draft {
  id: string;
  title: string;
  icon: string;
  source: NoteSource;
  daysAgo: number;
  people: string[];
  tags: string[];
  lines: string[];
}

function draft(
  id: string,
  title: string,
  icon: string,
  source: NoteSource,
  daysAgo: number,
  people: string[],
  tags: string[],
  lines: string[],
): Draft {
  return { id, title, icon, source, daysAgo, people, tags, lines };
}

const meetingNotes: Draft[] = [
  draft('note-sync-w05', 'Weekly sync W05', '🗓️', 'meeting-notes', 250, ['Maria', 'Arthur', 'Lena'], ['meeting', 'Meeting'], [
    'Maria opened with the beta slip from January.',
    'Arthur is still blocked on empty-state copy.',
    'Lena will bring three research clips next week.',
    'Decision: do not add a new surface until search is stable.',
  ]),
  draft('note-sync-w09', 'Weekly sync W09', '🗓️', 'meeting-notes', 222, ['Maria', 'Chris', 'Priya'], ['meeting', 'planning'], [
    'Priya walked the roadmap and cut two stretch goals.',
    'Chris asked who owns the settings IA.',
    'We parked notifications until after the offsite.',
    'Follow-up lives on the roadmap note.',
  ]),
  draft('note-sync-w13', 'Weekly sync W13', '🗓️', 'meeting-notes', 194, ['Maria', 'Arthur', 'Jonas'], ['meeting', 'Design'], [
    'Arthur demoed the first graph sketch. It was too dense.',
    'Jonas wants hubs to read at a glance, labels always on.',
    'Maria: keep the human in the loop, no silent refile.',
    'Next: a critique with Lena, not another slide.',
  ]),
  draft('note-sync-w17', 'Meeting notes W17', '🗓️', 'meeting-notes', 166, ['Lena', 'Kenji', 'Maria'], ['meeting', 'design'], [
    'Nobody titled this properly. It was the Wednesday sync.',
    'Kenji showed the onboarding empty state. Copy is still lorem.',
    'Lena said the flow assumes the user already knows the product.',
    'Action: rewrite the first screen before the next critique.',
  ]),
  draft('note-sync-w21', 'Weekly sync W21', '🗓️', 'meeting-notes', 138, ['Priya', 'Chris', 'Anna'], ['meeting', 'roadmap'], [
    'Anna joined for the first time and asked what "Atlas" is.',
    'Chris slipped the search timeout fix to next sprint.',
    'Priya wants a written decision on nesting topics one level only.',
    'We agreed and did not write it down anywhere else.',
  ]),
  draft('note-sync-w24', 'Weekly sync W24', '🗓️', 'meeting-notes', 117, ['Maria', 'Stefan', 'Olga'], ['Meeting', 'sync'], [
    'Stefan demoed German copy in the product. It overflows the button.',
    'Olga asked for a budget check before the Lisbon trip.',
    'Maria kept the agenda to 25 minutes. It still ran long.',
    'Parking lot: interview loop is eating design time.',
  ]),
  draft('note-sync-w28', 'Weekly sync W28', '🗓️', 'meeting-notes', 89, ['Arthur', 'Lena', 'Jonas'], ['meeting'], [
    'Arthur recapped the Harbor screen. He felt rusty.',
    'Lena offered to mock him on the engineer-collaboration story.',
    'Jonas is out Thursday for physio. No design review that day.',
    'Shipped: the type ramp experiment, behind a flag.',
  ]),
  draft('note-sync-w32', 'Weekly sync W32', '🗓️', 'meeting-notes', 61, ['Maria', 'Priya', 'Kenji'], ['meeting', 'launch'], [
    'Launch checklist is a page of unchecked boxes.',
    'Kenji: empty states are the risk, not the happy path.',
    'Priya moved the internal beta to the week after next.',
    'Need a stakeholder update that is shorter than this note.',
  ]),
  draft('note-sync-w36', 'Weekly sync W36', '🗓️', 'meeting-notes', 33, ['Chris', 'Anna', 'Lena'], ['meeting', 'retro'], [
    'Chris wants a retro that is not a feelings circle.',
    'Anna tracked three bugs that all start in search.',
    'Lena asked if we can collapse topics in the graph later.',
    'Decision deferred. Write it as a question, not a promise.',
  ]),
  draft('note-sync-w40', 'Weekly sync W40', '🗓️', 'meeting-notes', 7, ['Maria', 'Arthur', 'Priya'], ['meeting', 'Meeting'], [
    'Last sync before the demo. Arthur is traveling Friday.',
    'Priya will present the map, Maria will take questions.',
    'Open: what happens to notes the model cannot place.',
    'Working answer: they sit in Unsorted until a person moves them.',
  ]),
  draft('note-retro-q1', 'Q1 retro', '🔁', 'meeting-notes', 200, ['Maria', 'Priya', 'Chris', 'Lena'], ['retro', 'meeting'], [
    'Start: writing decisions down. Stop: untitled meeting notes.',
    'Continue: critiques with a single owner for next steps.',
    'Chris named the search timeout as the quarter’s scar.',
    'Priya asked for fewer status meetings. We scheduled another.',
  ]),
  draft('note-retro-q2', 'Retro — what actually shipped', '🔁', 'meeting-notes', 95, ['Jonas', 'Kenji', 'Anna'], ['retro', 'Meeting'], [
    'Shipped the settings IA. Did not ship notifications.',
    'Kenji: we prototype in the file and then lose the thread.',
    'Anna wants case studies updated in the same week we ship.',
    'One action: link the retro to the case study, not a new doc.',
  ]),
  draft('note-planning-h2', 'H2 planning workshop', '🧭', 'meeting-notes', 150, ['Priya', 'Maria', 'Noah'], ['planning', 'roadmap'], [
    'Noah (manager) asked for one bet, not five.',
    'The bet: make old notes findable without refiling by hand.',
    'Maria argued search is not enough if you forgot the words.',
    'Priya will turn this into a one-pager. It does not exist yet.',
  ]),
  draft('note-kickoff', 'Atlas kickoff', '🚀', 'meeting-notes', 210, ['Maria', 'Lena', 'Kenji', 'Jonas'], ['kickoff', 'design', 'Design'], [
    'Working name Atlas. Someone will hate it and that is fine.',
    'Lena: it should feel like a map, not a dashboard of cards.',
    'Kenji sketched hubs and small notes. No colors picked.',
    'Out of scope: editing the note body, mobile, real Notion sync.',
  ]),
  draft('note-design-crit', 'Design critique 14.03', '🎨', 'meeting-notes', 208, ['Lena', 'Kenji', 'Jonas', 'Maria'], ['design', 'critique', '#design-process'], [
    'We spent forty minutes on one onboarding screen.',
    'Jonas: the first hull in the sketch looks like a blob, keep it.',
    'Lena wants the AI reason visible, not buried in a tooltip.',
    'This was a meeting. It was also the design review.',
  ]),
  draft('note-design-crit-2', 'Critique: onboarding flow', '🎨', 'meeting-notes', 70, ['Lena', 'Kenji', 'Anna'], ['Design', '#design-process', 'critique'], [
    'Second pass on onboarding. The empty state still says "No data".',
    'Anna flagged the contrast on the yellow topic label.',
    'Kenji will try a dashed ring for low-confidence notes.',
    'Scheduled as a meeting, used as a design critique.',
  ]),
  draft('note-standup', 'standup notes (messy)', '📌', 'meeting-notes', 12, ['Chris', 'Anna'], ['meeting', 'standup'], [
    'chris: search still timing out on long pages',
    'anna: looking at it, no eta',
    'me: interview thursday, out at 3',
    'no decisions. barely a note.',
  ]),
  draft('note-untitled-1', 'Untitled', '📄', 'meeting-notes', 40, [], ['misc'], [
    'standup?',
    'ask Maria about the date',
    'graph thing — maybe friday',
  ]),
  draft('note-untitled-2', 'Untitled', '📄', 'meeting-notes', 15, [], [], [
    'something about a book',
    'the chapter on constraints',
    'come back to this',
  ]),
  draft('note-offsite', 'Offsite notes — Lisbon', '✈️', 'meeting-notes', 130, ['Maria', 'Priya', 'Olga', 'Noah'], ['offsite', 'planning'], [
    'Two days, one bet, too many stickies.',
    'Noah wants a customer story, not a feature list.',
    'Olga booked the flights. Details are in a separate task.',
    'We left with a sentence: show how the work connects.',
  ]),
  draft('note-incident', 'Incident review: search timeout', '🚨', 'meeting-notes', 80, ['Chris', 'Anna', 'Priya'], ['incident', 'meeting'], [
    'Search timed out for pages over a few thousand blocks.',
    'Anna found a query that loads the whole tree.',
    'Chris will cap it. Priya will tell stakeholders plainly.',
    'No blame. Write the fix next to the story, not in slack.',
  ]),
  draft('note-roadmap', 'Roadmap review 02.06', '🗺️', 'meeting-notes', 128, ['Priya', 'Noah', 'Maria'], ['roadmap', 'planning'], [
    'June review. Half the Q2 row is still "in progress".',
    'Noah cut the collaboration idea. One workspace is enough.',
    'Maria protected time for the knowledge map.',
    'Next review is the stakeholder update, shorter than this.',
  ]),
  draft('note-stakeholders', 'Stakeholder update', '📣', 'meeting-notes', 20, ['Priya', 'Noah', 'Elena'], ['update', 'meeting'], [
    'Elena (from the other org) asked for a date. We did not give one.',
    'Showed the messy before: untitled notes, no clusters.',
    'Noah framed it as findability, not another AI feature.',
    'Send the one-pager. The one-pager is still this note.',
  ]),
  draft('note-hiring-sync', 'Hiring sync', '🧭', 'meeting-notes', 55, ['Maria', 'Elena', 'Arthur'], ['hiring', 'interview', 'meeting'], [
    'Elena is running the loop. Arthur is on the panel.',
    'We need two stories ready: search incident, onboarding.',
    'Maria asked if this is a meeting or interview prep. Both.',
    'Debrief goes in a separate note if the onsite happens.',
  ]),
  draft('note-launch', 'Launch checklist review', '✅', 'meeting-notes', 18, ['Priya', 'Kenji', 'Anna'], ['launch', 'design'], [
    'Checklist review that turned into a design punch list.',
    'Kenji: empty states, focus rings, and the legend are open.',
    'Anna will not block launch on the nice-to-have chart.',
    'Priya wants a go/no-go on Thursday.',
  ]),
  draft('note-ru-sync', 'Еженедельный синк 18.02', '🗓️', 'meeting-notes', 232, ['Maria', 'Olga'], ['meeting', 'синк'], [
    'Короткий синк на русском, потому что Ольга так и пишет.',
    'Мария: не перекладывать старые заметки руками.',
    'Ольга напомнила про билеты в Лиссабон.',
    'Решили вернуться к этому в обычном weekly.',
  ]),
  draft('note-de-sync', 'Wochenmeeting 07.09', '🗓️', 'meeting-notes', 31, ['Stefan', 'Lena', 'Maria'], ['meeting', 'Deutsch'], [
    'Stefan wollte das Weekly einmal auf Deutsch üben.',
    'Lena hat die Kritik-Termine für September vorgelesen.',
    'Maria hat zugestimmt, solange die Entscheidungen auf Englisch bleiben.',
    'Nächstes Mal wieder die normale Sync-Seite.',
  ]),
  draft('note-workshop', 'Workshop: prioritization', '🧩', 'meeting-notes', 110, ['Priya', 'Maria', 'Jonas', 'Lena'], ['workshop', 'planning'], [
    'We scored ideas on a wall. The map won. Notifications lost.',
    'Jonas argued for a free-form layout as well as clusters.',
    'Lena wants drag-and-drop to feel obvious without a tour.',
    'Three steps of coaching, then get out of the way.',
  ]),
  draft('note-allhands', 'All-hands notes', '👥', 'meeting-notes', 45, ['Noah', 'Priya', 'Elena'], ['all-hands', 'meeting'], [
    'Noah talked about focus. The slide had six priorities.',
    'Elena mentioned hiring is behind. No names in this note.',
    'A question from the back: where do old docs go to die?',
    'Priya said that is the point of the map. Then we ran out of time.',
  ]),
  draft('note-brainstorm', 'Brainstorm: graph view', '💡', 'meeting-notes', 175, ['Lena', 'Kenji', 'Jonas', 'Maria'], ['brainstorm', 'design', '#design-process'], [
    'Half meeting, half sketching on a whiteboard photo I lost.',
    'Ideas: hulls around topics, a minimap, fly-to on search.',
    'Kenji wants pins. Lena wants the AI to explain itself.',
    'Maria: if a person moves a note, the model never moves it back.',
  ]),
];

const oneOnOnes: Draft[] = [
  draft('note-11-maria', '1:1 with Maria', '👤', 'meeting-notes', 14, ['Maria'], ['1:1', 'meeting'], [
    'Maria asked what I would drop if the week got worse.',
    'I said the extra critique. She said keep the critique, drop the status deck.',
    'Career: she thinks the map is the story to tell, not a side project.',
    'Next 1:1 in two weeks. I will bring a written bet.',
  ]),
  draft('note-11-maria-2', '1:1 Maria — career', '👤', 'meeting-notes', 100, ['Maria'], ['1:1', 'career'], [
    'Talked about scope. I keep collecting process work.',
    'Maria: pick a problem people feel, not a framework.',
    'She suggested writing the interview stories from real projects.',
    'I left with one question: what would I show a hiring manager?',
  ]),
  draft('note-11-arthur', '1:1 with Arthur', '👤', 'meeting-notes', 26, ['Arthur'], ['1:1'], [
    'Arthur is tired of panels that ask the same question twice.',
    'He offered a mock on "how do you work with engineers?"',
    'We also talked about his move to the platform team. Not urgent.',
    'I owe him a time. Thursday after the sync if the sync ends.',
  ]),
  draft('note-11-lena', '1:1 with Lena', '👤', 'meeting-notes', 9, ['Lena'], ['1:1', 'design'], [
    'Lena wants fewer docs and more decisions in the file.',
    'We looked at the onboarding case study. The ending is weak.',
    'She asked me to sit in the next critique as a note-taker, not a presenter.',
    'Personal: her knee is better. She is running again.',
  ]),
  draft('note-11-chris', '1:1 Chris 03.04', '👤', 'meeting-notes', 188, ['Chris'], ['1:1', 'eng'], [
    'Chris explained the search timeout without a diagram. I drew one after.',
    'He does not want a redesign of search. He wants a smaller query.',
    'We agreed the incident note is the source of truth, not slack.',
    'He will review the handoff checklist if it stays under a page.',
  ]),
  draft('note-11-olga', '1:1 with Olga', '👤', 'meeting-notes', 60, ['Olga'], ['1:1'], [
    'Olga is splitting time with the other squad. She is protective of it.',
    'We talked about the Lisbon flights and who is actually going.',
    'She asked me to stop sending budget questions in chat.',
    'Write them in the finance note. She will comment there.',
  ]),
  draft('note-11-priya', '1:1 Priya', '👤', 'meeting-notes', 4, ['Priya'], ['1:1', 'planning'], [
    'Priya’s 1:1s are almost standups. We caught it and slowed down.',
    'She is worried the demo explains the model and not the job.',
    'I will open with the pile of untitled notes, then the map.',
    'She will cut slides if I send them tonight. I will not.',
  ]),
  draft('note-11-jonas', '1:1 Jonas — probation', '👤', 'meeting-notes', 77, ['Jonas'], ['1:1', 'feedback'], [
    'Jonas is at month five. He wanted to know if he is on track.',
    'Yes. The IA work is the evidence. Say that in the review, not "vibes".',
    'He gets stuck polishing. Ship the settings tree.',
    'Next: he shadows a user interview, he does not run it yet.',
  ]),
  draft('note-11-kenji', '1:1 with Kenji', '👤', 'meeting-notes', 36, ['Kenji'], ['1:1', 'Design'], [
    'Kenji showed three type ramps. I picked the quiet one.',
    'He is uneasy about AI-colored clusters looking like confetti.',
    'We looked at Notion’s palette and stole the restraint.',
    'He will bring swatches, not a gradient.',
  ]),
  draft('note-11-anna', '1:1 Anna', '👤', 'meeting-notes', 22, ['Anna'], ['1:1'], [
    'Anna wants clearer bug reports from design. Fair.',
    'We used the search timeout as the example of a good writeup.',
    'She is mentoring a new engineer and is behind on reviews.',
    'I will stop pinging her for visual nits in the same thread as incidents.',
  ]),
  draft('note-11-stefan', '1:1 Stefan', '👤', 'meeting-notes', 50, ['Stefan'], ['1:1', 'german'], [
    'Stefan asked if I am actually learning German or collecting apps.',
    'Honest answer: vocabulary notes, little speaking.',
    'He offered twenty minutes after the weekly, in German, badly.',
    'I said yes. The note for that should not be this 1:1.',
  ]),
  draft('note-11-noah', '1:1 with Noah', '👤', 'meeting-notes', 64, ['Noah'], ['1:1', 'manager'], [
    'Skip the status. Noah had already read the roadmap note.',
    'He asked what I am avoiding. Interview prep. I admitted it.',
    'Advice: write the stories from work I already did. Do not invent a persona.',
    'He will introduce me to Elena if I send the resume. The resume is a mess.',
  ]),
  draft('note-11-elena', 'Skip-level with Elena', '👤', 'meeting-notes', 85, ['Elena'], ['1:1', 'skip-level'], [
    'Elena asked what I would change about planning. Fewer themes, more cuts.',
    'She talked about the hiring gap without naming roles in this note.',
    'I mentioned the map. She asked how a person corrects the machine.',
    'That question is the product. I should write it down somewhere durable.',
  ]),
  draft('note-11-de-lena', 'Gespräch mit Lena', '👤', 'meeting-notes', 28, ['Lena'], ['1:1', 'Deutsch'], [
    'Kurzes Gespräch auf Deutsch. Lena war geduldig.',
    'Wir haben über die Kritik am Onboarding gesprochen, mit vielen Pausen.',
    'Sie hat gesagt: schreib die Entscheidung auf, nicht nur die Meinung.',
    'Nächstes Mal wieder Englisch, wenn es um Termine geht.',
  ]),
  draft('note-11-ru-maria', '1:1 с Марией', '👤', 'meeting-notes', 120, ['Maria'], ['1:1'], [
    'Редкий 1:1 на русском. Мария перешла на него сама.',
    'Тема: не тащить все встречи в одну кучу.',
    'Она спросила, отличаю ли я синк от личного разговора. Да.',
    'Договорились, что карьерный разговор живёт отдельно.',
  ]),
  draft('note-11-feedback', 'Feedback for Chris', '👤', 'meeting-notes', 48, ['Chris', 'Maria'], ['1:1', 'feedback'], [
    'Notes before I talk to Chris, so I do not improvise.',
    'He explains incidents clearly. He disappears when the topic is visual.',
    'Ask for one review on the handoff list, not ongoing design opinions.',
    'Maria said keep it specific. One example, one ask.',
  ]),
  draft('note-11-goals', 'Goals check-in', '🎯', 'meeting-notes', 160, ['Noah', 'Maria'], ['1:1', 'goals'], [
    'Half-year goals. Two of them are vague enough to always be true.',
    'Keep: ship a findability slice. Drop: "raise the craft bar".',
    'Noah wants evidence a stranger could read.',
    'Maria will look at the case studies before the next check-in.',
  ]),
  draft('note-11-untitled', 'Untitled', '📄', 'meeting-notes', 3, [], ['1:1'], [
    'talked for 30 min',
    'seemed fine',
    'forgot to write the name',
  ]),
];

const interviewNotes: Draft[] = [
  draft('note-q-01', '#1 Tell me about yourself', '🎯', 'docs', 90, ['Elena'], ['interview', 'Interview'], [
    'Ninety seconds. Designer who sits with engineers, not a process tourist.',
    'Proof: the search incident, the onboarding rewrite.',
    'Do not recite the resume. The resume is a separate mess.',
    'End on what I want next: a problem with a pile of messy information.',
  ]),
  draft('note-q-03', '#3 Why are you leaving?', '🎯', 'docs', 88, [], ['interview'], [
    'Not "leaving". Looking. The current team is fine and also full.',
    'I want the work, not a narrative about escape.',
    'If they push: scope stopped growing. Say that without blaming Noah.',
    'Practice this out loud. It sounds defensive when I only write it.',
  ]),
  draft('note-q-07', '#7 A time you failed', '🎯', 'docs', 74, ['Chris'], ['interview', 'story'], [
    'The first search fix made the UI faster and the query worse.',
    'I had specified the wrong layer. Chris caught it in review.',
    'What changed: I now ask which layer before drawing the layer.',
    'Keep it short. They asked for failure, not a redemption arc.',
  ]),
  draft('note-q-12', '#12 How do you work with engineers?', '🎯', 'docs', 16, ['Chris', 'Anna', 'Arthur'], ['interview', 'eng'], [
    'Start from the constraint, not the mock.',
    'Example: Anna and the timeout. We wrote the limit together.',
    'I bring a decision and the open question, not fifty variants.',
    'Arthur says this is the question I rush. Slow down on the example.',
  ]),
  draft('note-q-14', '#14 Design critique in an interview', '🎯', 'docs', 42, ['Lena'], ['interview', 'Design', '#design-process'], [
    'They may ask me to critique a flow I do not know.',
    'Structure: who it is for, what I notice, what I would try next.',
    'Steal from our own critiques: one owner, one next step.',
    'This card is prep and also a note about how we critique at work.',
  ]),
  draft('note-q-18', '#18 System design for a PM', '🎯', 'docs', 67, [], ['interview', 'product'], [
    'I am not going to pretend to be an engineer.',
    'Talk about the objects: notes, topics, assignments, locks.',
    'Mention batching and why a person reviews before anything moves.',
    'Draw the three panes if they hand me a pen.',
  ]),
  draft('note-q-21', '#21 Stakeholder who disagrees', '🎯', 'docs', 52, ['Noah', 'Priya'], ['interview'], [
    'Noah wanted collaboration. Priya and I wanted one workspace.',
    'We showed the cost, not the taste. He cut it in the roadmap review.',
    'I did not "manage up". I wrote the tradeoff in a note he already read.',
    'Use the roadmap review as the scene.',
  ]),
  draft('note-q-22', '#22 Prioritization under pressure', '🎯', 'docs', 29, ['Priya'], ['interview', 'planning'], [
    'Launch week. Empty states versus a new chart nobody asked for.',
    'Priya asked for a go/no-go. I cut the chart in the room.',
    'Rule: if it does not help someone find a note, it waits.',
    'This pairs with the launch checklist note.',
  ]),
  draft('note-story-onboarding', 'Story: onboarding redesign', '📘', 'docs', 102, ['Lena', 'Kenji'], ['interview', 'story', 'design'], [
    'Situation: first-run assumed the user already had a system.',
    'What I did: five interviews, then a quieter first screen.',
    'Kenji rebuilt the empty state. Lena ran the second critique.',
    'Result: people finished setup. The case study has the numbers.',
  ]),
  draft('note-story-search', 'Story: search timeout', '📘', 'docs', 81, ['Chris', 'Anna'], ['interview', 'story'], [
    'Pages over a certain size timed out. Support had the tickets.',
    'I wrote the incident with Anna, Chris capped the query.',
    'My part was the boundary, not the patch.',
    'Do not over-claim the code.',
  ]),
  draft('note-story-research', 'Story: research ops', '📘', 'docs', 140, ['Jonas', 'Lena'], ['interview', 'research'], [
    'Research notes were trapped in personal docs.',
    'We made a light template. People still named files badly.',
    'Lesson: templates do not create structure. Review does.',
    'Useful if they ask about research, less so for a craft loop.',
  ]),
  draft('note-company-northstar', 'Northstar — company notes', '🏢', 'docs', 24, ['Elena'], ['interview', 'Northstar'], [
    'Northstar builds tools for clinic admins. Slow, regulated, serious.',
    'The hiring manager cares about workflow, not a brand refresh.',
    'Elena knows someone there. Do not lead with that.',
    'Questions: how do they handle messy legacy records?',
  ]),
  draft('note-company-figment', 'Figment interview loop', '🏢', 'docs', 11, ['Samira', 'Arthur'], ['interview', 'Figment'], [
    'Loop: recruiter Samira, hiring manager, a panel with Arthur as a friend not a colleague.',
    'Panel is Thursday. Portfolio in the morning, critique after lunch.',
    'They will ask about engineers. Use question 12, not the whole life story.',
    'Debrief the same day or I will rewrite history.',
  ]),
  draft('note-company-harbor', 'Harbor — HM screen', '🏢', 'docs', 58, ['Samira'], ['interview', 'Harbor'], [
    'Harbor is internal tools for logistics. The HM screen felt friendly and vague.',
    'I talked too much about visual craft. They wanted operational pain.',
    'Samira said it was not a no. It was not a yes.',
    'If they come back, start from the incident story.',
  ]),
  draft('note-questions', 'Questions to ask them', '❓', 'docs', 6, [], ['interview'], [
    'How do decisions survive the meeting that made them?',
    'What does a designer do in the first month, specifically?',
    'Where is the pile of unstructured notes today?',
    'Ask one of these. Not all. Leave silence.',
  ]),
  draft('note-comp', 'Compensation notes', '💶', 'docs', 19, ['Samira'], ['interview', 'finance', 'comp'], [
    'Samira quoted a band. I did not write the number in chat.',
    'Need to compare it with rent, tax, and the other loop.',
    'This is prep, and it is also personal finance. Both are true.',
    'Do not bring this up before they do.',
  ]),
  draft('note-portfolio', 'Portfolio narrative', '🗂️', 'docs', 37, ['Lena'], ['interview', 'portfolio', 'design'], [
    'Three projects: onboarding, checkout, and this map if it is ready.',
    'Lena said the checkout study still starts with the UI, not the problem.',
    'Order: problem, what I tried, what I cut, what shipped.',
    'The map is only in here if the demo does not embarrass me.',
  ]),
  draft('note-de-interview', 'Vorbereitung Gespräch 12.05', '🎯', 'docs', 149, ['Stefan'], ['interview', 'Deutsch'], [
    'Stefan hat mich abgefragt: Stell dich vor. Auf Deutsch, zwei Minuten.',
    'Ich bin ins Englische geflohen. Er hat es markiert.',
    'Nächster Versuch: die Onboarding-Geschichte in fünf Sätzen.',
    'Datum im Titel ist der Tag des Übungsgesprächs, nicht ein echtes Interview.',
  ]),
  draft('note-ru-interview', 'Подготовка к интервью', '🎯', 'docs', 135, ['Maria'], ['interview'], [
    'Мария спросила, умею ли я рассказать про провал без оправданий.',
    'Пробовала историю про поиск. Получилось длинно.',
    'Нужно уложить в минуту: что случилось, что я изменила.',
    'Это черновик, не карточка с номером.',
  ]),
  draft('note-debrief', 'Debrief: Figment onsite', '🗒️', 'docs', 2, ['Samira', 'Arthur', 'Lena'], ['interview', 'Figment', 'meeting'], [
    'Same-day debrief so I do not sand the edges off.',
    'Critique went well. I was specific. Panel was slower.',
    'Arthur said I rushed question 12 again.',
    'Samira will know next week. This reads like minutes, because it is.',
  ]),
  draft('note-mock', 'Mock interview with Arthur', '🎤', 'docs', 21, ['Arthur'], ['interview', '1:1'], [
    'Arthur played the panel. He was nicer than a real panel and then not.',
    'Question 12: I listed rituals. He asked for one decision.',
    'We also talked about his week. It stopped being a mock for ten minutes.',
    'Prep session and a 1:1. I am not going to split the note.',
  ]),
  draft('note-resume', 'Resume bullets', '📄', 'docs', 112, [], ['interview', 'resume'], [
    'Bullet about search still says "led". I did not lead it.',
    'Change to: defined the boundary with Anna and Chris.',
    'Onboarding bullet is fine. Checkout bullet is vague.',
    'Do not send this file. It is notes, not the resume.',
  ]),
  draft('note-references', 'References — who to ask', '📄', 'docs', 27, ['Lena', 'Chris', 'Maria'], ['interview', 'references'], [
    'Lena for craft. Chris for working with engineering. Maria for judgment.',
    'Ask before anyone lists them. Maria already said yes.',
    'Do not ask Noah and Elena both. Pick one.',
    'Write the ask in a sentence, not a paragraph.',
  ]),
  draft('note-untitled-interview', 'Untitled', '📄', 'docs', 8, [], ['interview'], [
    'answers half written',
    'company? figment maybe',
    'no question number',
  ]),
];

const designNotes: Draft[] = [
  draft('note-case-atlas', 'Case study: Knowledge Atlas', '✏️', 'wiki', 5, ['Lena', 'Kenji'], ['design', 'case-study', '#design-process'], [
    'Problem: notes pile up untitled. Search needs the words you forgot.',
    'Approach: the model proposes topics. A person drags corrections. Those stick.',
    'This page is the study and the project. Do not let it become a pitch.',
    'Open: screenshots once the graph exists. Not before.',
  ]),
  draft('note-case-checkout', 'Case study: checkout rewrite', '✏️', 'wiki', 240, ['Kenji', 'Anna'], ['design', 'case-study', 'checkout'], [
    'Checkout asked for the address twice and hid the shipping cost.',
    'We removed a step instead of illustrating it.',
    'Anna cared about the error states more than the success one.',
    'The study still opens with a picture. Lena was right about that.',
  ]),
  draft('note-case-onboarding', 'Case study: onboarding', '✏️', 'wiki', 170, ['Lena', 'Kenji', 'Jonas'], ['design', 'Design', 'onboarding'], [
    'Old first-run was a tour of buttons. People skipped and got lost.',
    'New one asks for a single pile of notes and shows the map.',
    'Interviews are in a separate note. Numbers belong here when I have them.',
    'Status: shipped behind a flag, study not finished.',
  ]),
  draft('note-case-mobile', 'Mobile nav exploration', '✏️', 'wiki', 190, ['Kenji'], ['design', 'mobile'], [
    'Exploration only. We are not shipping a mobile layout.',
    'Kenji tried a bottom bar. It fought the sidebar metaphor.',
    'Decision: desktop from 1280. Write that in the study so it looks chosen.',
    'Keep the frames. Do not present them.',
  ]),
  draft('note-process', 'Design process notes', '✏️', 'wiki', 155, ['Lena'], ['#design-process', 'design', 'Design'], [
    'Our actual process, not the poster version.',
    'Problem, a few sketches, a critique with an owner, then build.',
    'AI can propose a grouping. It does not close the critique.',
    'Tags for this note are a mess on purpose. People type "Design" and "design".',
  ]),
  draft('note-critique-principles', 'Critique principles', '✏️', 'wiki', 180, ['Lena', 'Jonas'], ['critique', '#design-process'], [
    'One artifact. One question. Notes that name a next step.',
    'No "I like". Say what you see and who it fails.',
    'The owner leaves with the decision, not a poll.',
    'Used in critiques and, awkwardly, in interview answers.',
  ]),
  draft('note-typography', 'Type ramp experiment', '✏️', 'wiki', 92, ['Kenji'], ['design', 'type'], [
    'Inter, 13px base. Hub labels 12/600. Note labels 10/400.',
    'Kenji tried 14px. It looked like a document, not a tool.',
    'We shipped the quieter ramp behind a flag in W28.',
    'Do not add a second font for "personality".',
  ]),
  draft('note-research-interviews', 'User interviews March', '🎙️', 'wiki', 185, ['Jonas', 'Lena', 'Samira'], ['research', 'interview', 'design'], [
    'Five people who live in Notion and still could not find last month.',
    'They do not want to refile. They want the pile sorted once, then corrected.',
    'Jonas took notes. Names are in the recording, not here.',
    'Easy to confuse with job-interview prep because both say "interview".',
  ]),
  draft('note-journey', 'Journey map — first week', '🗺️', 'wiki', 176, ['Jonas'], ['design', 'research'], [
    'Day 1: dump notes. Day 3: notice the wrong cluster. Day 7: stop opening search.',
    'The fragile moment is the first wrong grouping. If they cannot fix it, they leave.',
    'Drag has to be the fix. A settings page is not the fix.',
    'Jonas wants this on one page. It is already too long.',
  ]),
  draft('note-ia', 'IA for settings', '🗂️', 'wiki', 142, ['Jonas', 'Chris'], ['design', 'IA', 'settings'], [
    'Settings was a list of 40 rows. We grouped by job: appearance, data, account.',
    'Chris asked us not to hide experimental flags from him.',
    'Jonas shipped the tree. The study is the retro note, not this one.',
    'Related to the product, not to the map’s own settings. Naming collision.',
  ]),
  draft('note-prototype', 'Prototype notes v3', '🧪', 'wiki', 47, ['Kenji', 'Anna'], ['design', 'prototype'], [
    'v3 is the one with hulls. v2 was dots only and felt unfinished.',
    'Anna clicked a dot and expected a page. Right instinct.',
    'Drag between clusters is the only interaction that has to feel good.',
    'Everything else can be quieter.',
  ]),
  draft('note-handoff', 'Eng handoff checklist', '🤝', 'wiki', 39, ['Chris', 'Anna', 'Kenji'], ['design', 'handoff', 'meeting'], [
    'Written for Chris so I stop pasting mocks into chat.',
    'Includes states: empty, loading, error, low confidence.',
    'We reviewed it in a meeting and it also is the spec.',
    'Keep it under a page or Anna will not open it.',
  ]),
  draft('note-visual', 'Visual language', '🎨', 'wiki', 125, ['Kenji'], ['design', 'visual'], [
    'Dark first. Surface one step up from the background. No gradients.',
    'Topic colors are muted. Ten of them, Notion-like, including ones we may not use.',
    '8px radius, 8px grid, shadows barely there.',
    'Kenji’s phrase: it should look like a tool someone trusts at 11pm.',
  ]),
  draft('note-empty', 'Empty states', '🕳️', 'wiki', 34, ['Kenji', 'Anna'], ['design', 'empty'], [
    'Empty is a real state, not a broken one.',
    'No notes: explain the pile. No selection: do not invent a preview.',
    'Anna wants the words to say what to do, not "No data".',
    'Launch cares about this more than about another chart.',
  ]),
  draft('note-a11y', 'Accessibility pass', '♿', 'wiki', 13, ['Anna', 'Kenji'], ['design', 'a11y'], [
    'Keyboard: tab through topics, arrows across neighbors, M to move.',
    'Contrast 4.5:1 on text. The muted gray has to earn its place.',
    'Announced moves in a live region, including undo.',
    'Reduced motion: no glide that is only decorative. The simulation can settle faster.',
  ]),
  draft('note-de-design', 'Fallstudie: Checkout', '✏️', 'wiki', 230, ['Kenji'], ['design', 'case-study', 'Deutsch'], [
    'Deutsche Fassung der Checkout-Studie, angefangen und nicht zu Ende.',
    'Stefan wollte sie für ein Gespräch. Der englische Text ist die Quelle.',
    'Problem, Schnitt, Ergebnis — mehr habe ich auf Deutsch nicht geschafft.',
    'Nicht löschen. Sie zeigt, wo die Sprache bricht.',
  ]),
  draft('note-ru-design', 'Кейс: онбординг', '✏️', 'wiki', 168, ['Maria'], ['design', 'onboarding'], [
    'Короткий пересказ онбординга для Марии, не для портфолио.',
    'Было: тур по кнопкам. Стало: одна пачка заметок и карта.',
    'Цифры ещё не вписала. Английская версия полнее.',
    'Оставить как черновик перевода.',
  ]),
  draft('note-metrics', 'Design metrics that matter', '📈', 'wiki', 108, ['Priya', 'Anna'], ['design', 'metrics'], [
    'Priya asked for a number. "People find the note" is the number.',
    'Proxy: time from open to the right page, and corrections per organize.',
    'Do not track drags as success. A drag can be a fix or a fidget.',
    'Anna can instrument the open. I should not invent a dashboard.',
  ]),
];

const readingNotes: Draft[] = [
  draft('note-book-doet', 'The Design of Everyday Things — notes', '📚', 'journal', 260, [], ['reading', 'book'], [
    'Affordances, signifiers, mapping. I underlined mapping twice.',
    'A control should show what it affects. Dragging a note should show the destination.',
    'Norman would hate a cluster that moves with no explanation.',
    'Chapter 4 next, if I do not start another book.',
  ]),
  draft('note-book-shape', 'Shape Up — chapters 1–4', '📚', 'journal', 220, ['Priya'], ['reading', 'product'], [
    'Appetite, not estimates. Priya already works this way and calls it something else.',
    'Fixed time, variable scope. The map is a six-week bet if we cut the extras.',
    'Betting table notes do not match our roadmap review, but the idea does.',
    'Stop at chapter 4 until the project uses it.',
  ]),
  draft('note-article-graph', 'Article: graph layout for knowledge', '📚', 'journal', 54, [], ['reading', 'graph', 'design'], [
    'Force layouts look alive and lie a little. That is acceptable if clusters stay stable.',
    'Hulls help more than edge bundling for "what belongs together".',
    'I read this for the Atlas project. It is still a reading note.',
    'Save the paper on TF-IDF somewhere else. This one is about layout.',
  ]),
  draft('note-article-ai', 'Notes on AI clustering', '📚', 'journal', 63, [], ['reading', 'ai', 'design'], [
    'Clusters from embeddings are suggestions. Treat them as a first draft.',
    'Show confidence. Let a correction win forever.',
    'The article is more confident in the model than I am.',
    'Relevant to the design work, filed here because I read it on a Sunday.',
  ]),
  draft('note-talk-julie', 'Talk: Julie Zhuo on managers', '📚', 'journal', 145, ['Noah'], ['reading', 'management'], [
    'Manager as editor, not author. Noah does this on a good week.',
    'Feedback is a few sharp notes, not a performance review in disguise.',
    'I thought about the feedback note for Chris while listening.',
    'Not going to make a framework out of a talk.',
  ]),
  draft('note-book-habits', 'Lesenotizen: Atomic Habits', '📚', 'journal', 205, [], ['reading', 'Deutsch', 'book'], [
    'Auf Deutsch gelesen, halb verstanden, zur Hälfte wegen der Sprache.',
    'Eine Idee behalten: die Umgebung ändert das Verhalten, nicht der Vorsatz.',
    'Fürs Training vielleicht nützlicher als fürs Produkt.',
    'Vokabeln stehen in der anderen Notiz, nicht hier.',
  ]),
  draft('note-paper-tfidf', 'TF-IDF reminder', '📚', 'journal', 66, [], ['reading', 'ai'], [
    'Term frequency times inverse document frequency. Common words weigh less.',
    'Enough for a fake similarity score when there is no API key.',
    'Keep the top matches, drop the weak ones.',
    'This is a reminder to myself, not a paper.',
  ]),
  draft('note-newsletter', 'Lenny newsletter 14.08', '📚', 'journal', 55, [], ['reading', 'product'], [
    'A guest on discovery. Nothing I had not heard, one good line.',
    '"The roadmap is a record of bets, not a container for ideas."',
    'Sounds like Noah in the June review.',
    'Unsubscribe if the next three are the same.',
  ]),
];

const healthNotes: Draft[] = [
  draft('note-run-plan', '10k plan', '🏃', 'journal', 72, [], ['health', 'sport', 'running'], [
    'Three runs a week. One of them slow enough to talk.',
    'Goal is September and I already moved it once.',
    'Knee: stop if it is sharp, not if it is dull. Physio said that.',
    'Do not turn this into a spreadsheet.',
  ]),
  draft('note-gym-log', 'Gym log September', '🏋️', 'journal', 25, [], ['health', 'gym'], [
    'Week 1: squats felt heavy, sleep was bad.',
    'Week 2: same weights, better. Did not add more.',
    'Skipped Friday because of the interview loop.',
    'Log is for honesty, not for an audience.',
  ]),
  draft('note-sleep', 'Sleep notes', '😴', 'journal', 10, [], ['health', 'sleep'], [
    'Short nights line up with bad critiques. Sample size: me.',
    'No phone in bed lasted four days.',
    'Coffee after 3pm shows up here at 1am.',
    'Not a program. A record.',
  ]),
  draft('note-physio', 'Physio — knee', '🦵', 'journal', 98, [], ['health', 'physio'], [
    'Physio says the knee is load, not damage. I want that to be true.',
    'Exercises: step-down, a boring band, no heroics.',
    'Running stays. Intervals wait.',
    'Jonas covered the review the week I went at lunch.',
  ]),
  draft('note-de-health', 'Trainingsplan Oktober', '🏃', 'journal', 6, ['Stefan'], ['health', 'Deutsch', 'sport'], [
    'Oktober: zweimal laufen, einmal Kraft. Auf Deutsch, weil Stefan nachgefragt hat.',
    'Knie beobachten. Wenn es sticht, pausieren.',
    'Das ist ein Trainingsplan und gleichzeitig Vokabelübung.',
    'Die englische 10k-Notiz bleibt die Quelle.',
  ]),
  draft('note-mood', 'Mood / energy log', '📓', 'journal', 1, [], ['health', 'mood'], [
    'Low on Sunday. Fine on Monday. Not a pattern yet.',
    'Interview weeks dip. Offsites dip in a different way.',
    'Write one line or skip. Do not analyze.',
  ]),
];

const germanNotes: Draft[] = [
  draft('note-de-vocab', 'Vokabeln Woche 12', '🇩🇪', 'journal', 9, ['Stefan'], ['german', 'Deutsch'], [
    'die Kritik, der Entwurf, die Zuversicht — Zuversicht kann ich nicht benutzen.',
    'Stefan hat "genau" als Füllwort markiert. Ich sage es zu oft.',
    'Fünf Wörter, in Sätzen, nicht in einer Liste. Die Liste ist trotzdem hier.',
    'Nächste Woche: etwas über die Arbeit, nicht über das Wetter.',
  ]),
  draft('note-de-cases', 'Case endings drill', '🇩🇪', 'journal', 44, ['Stefan'], ['german', 'grammar'], [
    'Akkusativ after the verb, dative after mit. I still swap them when I am tired.',
    'Drills from the lesson, corrected in the margin.',
    'Not a journal entry. It will look like one because it lives here.',
    'Stefan said accuracy can wait behind finishing the sentence.',
  ]),
  draft('note-de-practice', 'German practice with Stefan', '🇩🇪', 'journal', 23, ['Stefan'], ['german', 'Deutsch'], [
    'Twenty minutes after the weekly, as promised in the 1:1.',
    'We described the onboarding problem. I stalled on "empty state".',
    'He refused to switch to English until the twenty minutes were gone.',
    'Do it again next week. Put it on the calendar or it will not happen.',
  ]),
  draft('note-de-exam', 'A2 practice test', '🇩🇪', 'journal', 115, [], ['german', 'exam'], [
    'Timed a practice test on a Sunday. Listening was the weak part.',
    'Reading was fine when the topic was concrete.',
    'Not registering for a real exam until I can finish a thought aloud.',
    'Score does not go in the title. It was not good enough to frame.',
  ]),
];

const lifeNotes: Draft[] = [
  draft('note-car-brakes', 'Car service — brake noise', '🚗', 'tasks', 17, [], ['car', 'errand'], [
    'Squeal on the last three stops. Worse in the morning.',
    'Shop can take it Thursday. Ask for the old parts back.',
    'Budget: I do not know. Look at the invoice note after.',
    'Do not "observe it for a month".',
  ]),
  draft('note-insurance', 'Insurance renewal', '📄', 'tasks', 123, ['Olga'], ['finance', 'insurance'], [
    'Renewal is higher. Olga asked if we actually compared.',
    'I compared two tabs and got tired.',
    'Need the number from last year. It is in email, not here.',
    'Decide this week so it does not auto-renew the expensive one.',
  ]),
  draft('note-budget', 'Rent and budget March', '💶', 'tasks', 195, ['Olga'], ['finance', 'budget'], [
    'March rent left less than the spreadsheet predicted.',
    'The spreadsheet was hopeful. The account was not.',
    'Cut: another app, the extra course, not food.',
    'Olga wants this updated quarterly, not when I feel guilty.',
  ]),
  draft('note-tax', 'Tax notes 2025', '💶', 'tasks', 250, [], ['finance', 'tax'], [
    'Collect the forms before April panic.',
    'Freelance invoice from the workshop talk is the one I forget.',
    'Do not mix this with compensation notes from the job search.',
    'Accountant gets a folder, not this page. This page is the reminder.',
  ]),
  draft('note-bike', 'Bike repair', '🚲', 'tasks', 30, [], ['errand', 'bike'], [
    'Flat on the rear. Patch kit is empty.',
    'Shop near the office if Thursday is already the car.',
    'Not urgent. It becomes urgent the first dry morning.',
  ]),
  draft('note-apartment', 'Apartment inventory', '🏠', 'tasks', 270, ['Olga'], ['home'], [
    'List for the landlord before something breaks.',
    'The window in the kitchen sticks. Write it down now.',
    'Olga has the photos. I have this unfinished list.',
  ]),
  draft('note-flight', 'Flight to Lisbon', '✈️', 'tasks', 126, ['Olga', 'Maria'], ['travel', 'offsite', 'errand'], [
    'Olga booked it. I have the confirmation in email and the time here.',
    'This is an errand and also the offsite. The meeting note is the other half.',
    'Return is Sunday. Do not schedule a critique that morning.',
    'Receipts go in the budget note if I remember.',
  ]),
  draft('note-dentist', 'Dentist', '🦷', 'tasks', 35, [], ['health', 'errand'], [
    'Cleaning Thursday 8:10. They will scold the flossing.',
    'Take the earlier train. Last time I ran.',
    'It is an errand. It is also the only health admin I do on time.',
  ]),
  draft('note-subscriptions', 'Subscriptions audit', '💳', 'tasks', 83, ['Olga'], ['finance'], [
    'Three things I do not remember opening.',
    'Olga highlighted two. I will cancel them or defend them.',
    'Do this on a boring evening, not during planning week.',
  ]),
  draft('note-moving', 'Moving boxes', '📦', 'tasks', 255, ['Olga'], ['home', 'errand'], [
    'Boxes still in the hall from January. They are furniture now.',
    'One has books I meant to shelve. One has cables.',
    'Saturday, one hour, no optimization.',
    'If it is still here in May this note has failed.',
  ]),
  draft('note-de-invoice', 'Rechnung Werkstatt', '🚗', 'tasks', 16, [], ['car', 'Deutsch', 'finance'], [
    'Die Werkstatt hat die Rechnung auf Deutsch geschickt.',
    'Bremsen vorne. Der Betrag steht auf dem PDF, nicht in dieser Notiz.',
    'Mit der Budget-Notiz abgleichen, wenn ich die PDF nicht verlege.',
    'Stefan muss das nicht korrigieren. Es ist eine Rechnung, kein Aufsatz.',
  ]),
  draft('note-ru-budget', 'Квитанции и бюджет', '💶', 'tasks', 198, ['Olga'], ['finance', 'budget'], [
    'Ольга попросила квитанции в одном месте, не в чате.',
    'Март уже лежит в английской заметке. Здесь только то, что пришло по-русски.',
    'Страховка и квитанция за мастерскую — проверить суммы.',
    'Не перевод всего бюджета, только пачка бумаг.',
  ]),
];

const drafts: Draft[] = [
  ...meetingNotes,
  ...oneOnOnes,
  ...interviewNotes,
  ...designNotes,
  ...readingNotes,
  ...healthNotes,
  ...germanNotes,
  ...lifeNotes,
];

const EXTRA_LINKS: Record<string, string[]> = {
  'note-design-crit': ['note-process', 'note-case-onboarding'],
  'note-design-crit-2': ['note-case-onboarding', 'note-empty'],
  'note-hiring-sync': ['note-references', 'note-q-01'],
  'note-brainstorm': ['note-case-atlas', 'note-visual'],
  'note-mock': ['note-11-arthur', 'note-q-12'],
  'note-debrief': ['note-company-figment', 'note-q-12'],
  'note-q-14': ['note-critique-principles'],
  'note-comp': ['note-budget'],
  'note-research-interviews': ['note-journey', 'note-case-onboarding'],
  'note-handoff': ['note-prototype', 'note-sync-w17'],
  'note-article-ai': ['note-case-atlas'],
  'note-article-graph': ['note-case-atlas', 'note-article-ai'],
  'note-flight': ['note-offsite'],
  'note-de-health': ['note-de-vocab', 'note-run-plan'],
  'note-launch': ['note-empty', 'note-case-atlas'],
  'note-story-onboarding': ['note-case-onboarding'],
  'note-story-search': ['note-incident'],
  'note-de-invoice': ['note-car-brakes'],
  'note-ru-budget': ['note-budget'],
  'note-de-design': ['note-case-checkout'],
  'note-ru-design': ['note-case-onboarding'],
  'note-book-habits': ['note-run-plan'],
  'note-11-de-lena': ['note-11-lena'],
  'note-11-ru-maria': ['note-11-maria'],
  'note-de-interview': ['note-q-01'],
  'note-ru-interview': ['note-q-03'],
  'note-ru-sync': ['note-sync-w05'],
  'note-de-sync': ['note-sync-w36'],
  'note-untitled-interview': ['note-q-01', 'note-questions'],
  'note-kickoff': ['note-case-atlas'],
  'note-11-feedback': ['note-11-chris'],
  'note-metrics': ['note-stakeholders'],
  'note-de-practice': ['note-11-stefan'],
};

function chainLinks(ids: readonly string[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  ids.forEach((id, index) => {
    const links = map.get(id) ?? new Set<string>();
    const next = ids[index + 1];
    const prev = ids[index - 1];
    if (next) {
      links.add(next);
    }
    if (prev) {
      links.add(prev);
    }
    map.set(id, links);
  });
  return map;
}

function linksFor(groups: Draft[][]): Map<string, string[]> {
  const orphans = new Set<string>(ORPHAN_IDS);
  const map = new Map<string, Set<string>>();
  for (const group of groups) {
    const chained = chainLinks(group.map((item) => item.id).filter((id) => !orphans.has(id)));
    for (const [id, links] of chained) {
      map.set(id, links);
    }
  }
  for (const [id, extras] of Object.entries(EXTRA_LINKS)) {
    const links = map.get(id) ?? new Set<string>();
    for (const extra of extras) {
      links.add(extra);
    }
    map.set(id, links);
  }
  for (const id of orphans) {
    map.set(id, new Set());
  }
  return new Map([...map.entries()].map(([id, links]) => [id, [...links]]));
}

function isoDaysAgo(days: number): string {
  return new Date(ANCHOR_MS - days * DAY_MS).toISOString();
}

function excerptOf(markdown: string): string {
  const plain = markdown.replace(/\s+/g, ' ').trim();
  if (plain.length <= 200) {
    return plain;
  }
  return `${plain.slice(0, 199)}…`;
}

function buildNotes(sourceDrafts: Draft[], links: Map<string, string[]>): Note[] {
  return sourceDrafts.map((item) => {
    const content = item.lines.join('\n');
    const updatedDaysAgo = Math.max(0, item.daysAgo - (item.id.length % 6));
    const note: Note = {
      id: item.id,
      title: item.title,
      icon: item.icon,
      source: item.source,
      createdAt: isoDaysAgo(item.daysAgo),
      updatedAt: isoDaysAgo(updatedDaysAgo),
      excerpt: excerptOf(content),
      content,
      people: item.people,
      tags: item.tags,
      links: links.get(item.id) ?? [],
      notionUrl: `https://www.notion.so/knowledge-atlas/${item.id}`,
    };
    return note;
  });
}

function assertSeed(built: Note[]): void {
  const ids = new Set<string>();
  for (const note of built) {
    if (ids.has(note.id)) {
      throw new Error(`Duplicate note id: ${note.id}`);
    }
    ids.add(note.id);
    const lineCount = note.content.split('\n').filter((line) => line.trim().length > 0).length;
    if (lineCount < 3 || lineCount > 15) {
      throw new Error(`${note.id} has ${lineCount} content lines`);
    }
  }
  if (built.length !== 120) {
    throw new Error(`Expected 120 notes, got ${built.length}`);
  }
  for (const note of built) {
    for (const link of note.links) {
      if (!ids.has(link)) {
        throw new Error(`${note.id} links to missing note ${link}`);
      }
    }
  }
  for (const [id, title] of Object.entries(NON_ENGLISH_TITLES)) {
    const note = built.find((item) => item.id === id);
    if (!note || note.title !== title) {
      throw new Error(`Non-English title mismatch for ${id}`);
    }
  }
}

const linkMap = linksFor([
  meetingNotes,
  oneOnOnes,
  interviewNotes,
  designNotes,
  readingNotes,
  healthNotes,
  germanNotes,
  lifeNotes,
]);

export const notes: Note[] = noteSchema.array().parse(buildNotes(drafts, linkMap));
assertSeed(notes);
