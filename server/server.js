const express = require('express'); //express.js thru node for web comm
const pool = require('./db');  //imports created postgres pool from db.js
const app = express();  // creates new express app
app.use(express.json());
//default for localhost 3000
const port = 3000;

// change the path to check the database, instantly return "request obj and response obj"
// request object is stuff like ip addr, http method
// response obj is what goes to client
app.get('/db-test', async (req, res) => {
  try { // try catch
    // postgres prompted to return current time as result in UTC
    const result = await pool.query('SELECT NOW()'); 
    res.json({ // json formatted response obj
      success: true, 
      message: 'Connected to AWS database',
      time: result.rows[0].now 
    });
  } catch (err) { // if cant connect to db, give fail response obh
    console.error('Connection error:', err);
    // http 500 is INTERNAL SERVER ERROR
    res.status(500).json({ error: 'Failed to connect to AWS database.' });
  }
});

app.get('/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Tables error:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.get('/init-db', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.json({ success: true, message: 'Database tables created successfully.' });
  } catch (err) {
    console.error('Init DB error:', err);
    res.status(500).json({ error: 'Failed to initialize database.' });
  }
});

app.get('/columns/:table', async (req, res) => {
  try {
    const { table } = req.params;

    const result = await pool.query(
      `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
      `,
      [table]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Columns error:', err);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
});


app.post('/decks', async (req, res) => {
  try {
    const { user_id, title, description } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: 'user_id and title are required' });
    }

    const result = await pool.query(
      `
      INSERT INTO decks (user_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [user_id, title, description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create deck error:', err);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

app.get('/decks', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM decks ORDER BY id ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get decks error:', err);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

app.post('/decks/:deckId/cards', async (req, res) => {
  try {
    const { deckId } = req.params;
    const { front, back } = req.body;

    if (!front || !back) {
      return res.status(400).json({ error: 'front and back are required' });
    }

    const deckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1`,
      [deckId]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const result = await pool.query(
      `
      INSERT INTO flashcards (deck_id, front, back)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [deckId, front, back]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add flashcard error:', err);
    res.status(500).json({ error: 'Failed to add flashcard' });
  }
});

app.get('/decks/:deckId/cards', async (req, res) => {
  try {
    const { deckId } = req.params;

    const result = await pool.query(
      `SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY id ASC`,
      [deckId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get flashcards error:', err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

app.patch('/cards/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { front, back } = req.body;

    const cardResult = await pool.query(
      `SELECT * FROM flashcards WHERE id = $1`,
      [cardId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const existingCard = cardResult.rows[0];

    const updatedFront = front ?? existingCard.front;
    const updatedBack = back ?? existingCard.back;

    const result = await pool.query(
      `
      UPDATE flashcards
      SET front = $1, back = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
      `,
      [updatedFront, updatedBack, cardId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Edit flashcard error:', err);
    res.status(500).json({ error: 'Failed to edit flashcard' });
  }
});


app.delete('/cards/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM flashcards
      WHERE id = $1
      RETURNING *;
      `,
      [cardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully',
      deletedCard: result.rows[0]
    });
  } catch (err) {
    console.error('Delete flashcard error:', err);
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

app.post('/decks/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    const originalDeckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1`,
      [id]
    );

    if (originalDeckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const originalDeck = originalDeckResult.rows[0];

    const newDeckResult = await pool.query(
      `
      INSERT INTO decks (user_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [
        originalDeck.user_id,
        `${originalDeck.title} (Copy)`,
        originalDeck.description
      ]
    );

    const newDeck = newDeckResult.rows[0];

    const cardsResult = await pool.query(
      `SELECT * FROM flashcards WHERE deck_id = $1`,
      [id]
    );

    for (const card of cardsResult.rows) {
      await pool.query(
        `
        INSERT INTO flashcards (deck_id, front, back)
        VALUES ($1, $2, $3)
        `,
        [newDeck.id, card.front, card.back]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Deck duplicated successfully',
      deck: newDeck
    });
  } catch (err) {
    console.error('Duplicate deck error:', err);
    res.status(500).json({ error: 'Failed to duplicate deck' });
  }
});

//allows for express and server to wait for client requests on the selected port
app.listen(port, () => {
  console.log(`StudyStrike running on http://localhost:${port}`);
  console.log(`Database test at http://localhost:${port}/db-test`);
});

// included nodemon as a node package to instantly update without restarting server