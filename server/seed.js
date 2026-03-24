const pool = require('./db');
const bcrypt = require('bcryptjs');

const seedData = [
  {
    deck: { title: 'Biology Basics', description: 'Fundamental concepts in cell biology and genetics' },
    cards: [
      { front: 'What is the powerhouse of the cell?', back: 'The mitochondria — produces ATP via cellular respiration' },
      { front: 'What is DNA?', back: 'Deoxyribonucleic acid — a double helix molecule that stores genetic information' },
      { front: 'What is mitosis?', back: 'Cell division that produces two genetically identical daughter cells' },
      { front: 'What is meiosis?', back: 'Cell division that produces four genetically unique haploid cells (used in sexual reproduction)' },
      { front: 'What is a ribosome?', back: 'An organelle that synthesizes proteins by translating mRNA' },
      { front: 'What is osmosis?', back: 'The movement of water across a semi-permeable membrane from low to high solute concentration' },
      { front: 'What is the function of the nucleus?', back: 'Controls cell activities and houses the cell\'s DNA' },
      { front: 'What is ATP?', back: 'Adenosine triphosphate — the primary energy currency of the cell' },
      { front: 'What is a eukaryote?', back: 'An organism whose cells have a membrane-bound nucleus (e.g. animals, plants, fungi)' },
      { front: 'What is natural selection?', back: 'The process by which individuals with favorable traits survive and reproduce more successfully' },
    ],
  },
  {
    deck: { title: 'CS Fundamentals', description: 'Core computer science concepts and data structures' },
    cards: [
      { front: 'What is Big O notation?', back: 'A way to describe the time or space complexity of an algorithm as input size grows' },
      { front: 'What is a binary search tree?', back: 'A tree where each node\'s left child is smaller and right child is larger than the node\'s value' },
      { front: 'What is recursion?', back: 'A function that calls itself with a smaller subproblem until it hits a base case' },
      { front: 'What is a hash table?', back: 'A data structure that maps keys to values using a hash function — average O(1) lookup' },
      { front: 'What is the difference between a stack and a queue?', back: 'Stack is LIFO (last in, first out); queue is FIFO (first in, first out)' },
      { front: 'What is O(n log n)?', back: 'The time complexity of efficient sorting algorithms like merge sort and quicksort (average)' },
      { front: 'What is a linked list?', back: 'A sequence of nodes where each node stores a value and a pointer to the next node' },
      { front: 'What is dynamic programming?', back: 'Breaking a problem into overlapping subproblems and caching results to avoid redundant work' },
      { front: 'What is a graph?', back: 'A data structure of nodes (vertices) connected by edges — can be directed or undirected' },
      { front: 'What is the difference between BFS and DFS?', back: 'BFS explores level by level (uses a queue); DFS explores depth-first (uses a stack or recursion)' },
    ],
  },
  {
    deck: { title: 'World History', description: 'Key events and figures from ancient to modern history' },
    cards: [
      { front: 'When did World War II end?', back: '1945 — Germany surrendered May 8, Japan surrendered September 2' },
      { front: 'What caused World War I?', back: 'The assassination of Archduke Franz Ferdinand in 1914, combined with militarism, alliances, imperialism, and nationalism' },
      { front: 'What was the Renaissance?', back: 'A cultural and intellectual rebirth in Europe (~14th–17th century) that rediscovered classical Greek and Roman ideas' },
      { front: 'What was the Cold War?', back: 'A geopolitical tension (1947–1991) between the US and USSR involving arms races, proxy wars, and ideological conflict' },
      { front: 'Who was Napoleon Bonaparte?', back: 'French military leader who rose to power after the French Revolution and briefly conquered much of Europe (1799–1815)' },
      { front: 'What was the Magna Carta?', back: 'A 1215 English charter that limited royal power and established that the king was subject to the rule of law' },
      { front: 'What was the French Revolution?', back: 'A period of radical political and social change in France (1789–1799) that abolished the monarchy and led to the rise of Napoleon' },
      { front: 'What was the Industrial Revolution?', back: 'The shift from agrarian economies to industrial manufacturing, beginning in Britain in the late 18th century' },
    ],
  },
  {
    deck: { title: 'Spanish Vocabulary', description: 'Essential everyday Spanish words and phrases' },
    cards: [
      { front: 'What does "hablar" mean?', back: 'To speak' },
      { front: 'What does "querer" mean?', back: 'To want / to love' },
      { front: 'What does "¿Dónde está...?" mean?', back: 'Where is...?' },
      { front: 'What does "tener" mean?', back: 'To have' },
      { front: 'What does "hacer" mean?', back: 'To do / to make' },
      { front: 'What does "poder" mean?', back: 'To be able to / can' },
      { front: 'What does "buenas noches" mean?', back: 'Good night' },
      { front: 'What is the difference between "ser" and "estar"?', back: '"Ser" is for permanent traits (identity, origin); "estar" is for temporary states (location, feelings)' },
      { front: 'What does "gracias" mean?', back: 'Thank you' },
      { front: 'What does "mañana" mean?', back: 'Tomorrow / morning' },
    ],
  },
  {
    deck: { title: 'Chemistry Essentials', description: 'Atomic structure, reactions, and the periodic table' },
    cards: [
      { front: 'What is an isotope?', back: 'Atoms of the same element with different numbers of neutrons' },
      { front: 'What is a covalent bond?', back: 'A chemical bond formed by two atoms sharing electrons' },
      { front: 'What is an ionic bond?', back: 'A bond formed when one atom transfers an electron to another, creating oppositely charged ions that attract' },
      { front: 'What is pH?', back: 'A scale from 0–14 measuring acidity/alkalinity — below 7 is acidic, above 7 is basic, 7 is neutral' },
      { front: 'What is the molar mass of water (H₂O)?', back: '18 g/mol (2×1 for hydrogen + 16 for oxygen)' },
      { front: 'What is Avogadro\'s number?', back: '6.022 × 10²³ — the number of particles in one mole of a substance' },
      { front: 'What is oxidation?', back: 'The loss of electrons by a molecule, atom, or ion (OIL — Oxidation Is Loss)' },
      { front: 'What is the difference between an element and a compound?', back: 'An element is a pure substance of one type of atom; a compound is two or more elements chemically bonded together' },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // Create a demo user to own the decks
    const salt = await bcrypt.genSalt(10);
    const pw_hash = await bcrypt.hash('demo1234', salt);

    const userRes = await pool.query(
      `INSERT INTO users (email, pw_hash, role, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['demo@studystrike.com', pw_hash, 'STUD', 'Demo Student']
    );
    const userId = userRes.rows[0].id;
    console.log(`✅ Demo user ready (id: ${userId})`);

    for (const { deck, cards } of seedData) {
      // Check if deck already exists for this user
      const existing = await pool.query(
        `SELECT id FROM decks WHERE user_id = $1 AND title = $2`,
        [userId, deck.title]
      );

      let deckId;
      if (existing.rows.length > 0) {
        deckId = existing.rows[0].id;
        console.log(`⏭  Deck already exists: "${deck.title}" — skipping`);
      } else {
        const deckRes = await pool.query(
          `INSERT INTO decks (user_id, title, description) VALUES ($1, $2, $3) RETURNING id`,
          [userId, deck.title, deck.description]
        );
        deckId = deckRes.rows[0].id;
        console.log(`📚 Created deck: "${deck.title}"`);

        for (const card of cards) {
          await pool.query(
            `INSERT INTO flashcards (deck_id, front, back) VALUES ($1, $2, $3)`,
            [deckId, card.front, card.back]
          );
        }
        console.log(`   ↳ Added ${cards.length} cards`);
      }
    }

    console.log('\n✅ Seed complete!');
    console.log('   Login with: demo@studystrike.com / demo1234');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
