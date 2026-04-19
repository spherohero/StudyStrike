      require('dotenv').config();
const express = require('express'); //express.js thru node for web comm
const pool = require('./db');  //imports created postgres pool from db.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// now using cookies instead of local storage bcs discussion on friday extremely unsecure
const cookieParser = require('cookie-parser');
const app = express();  // creates new express app
app.use(express.json());
app.use(cookieParser());
//default for localhost 3000
const port = 3000;

// change the path to check the database, instantly return "request obj and response obj"
// request object is stuff like ip addr, http method
// response obj is what goes to client
app.get('/api/db-test', async (req, res) => {
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

app.get('/api/tables', async (req, res) => {
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

app.get('/api/init-db', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        pw_hash VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('TEACH', 'STUD')),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // if table already exists AND NOW given through invite code of 6 alphanumeric
    await pool.query(`
      ALTER TABLE decks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE decks ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE;
      ALTER TABLE decks ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_deck_access (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, deck_id)
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
    await pool.query(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);


    res.json({ success: true, message: 'Database tables created successfully.' });
  } catch (err) {
    console.error('Init DB error:', err);
    res.status(500).json({ error: 'Failed to initialize database.' });
  }
});

app.get('/api/columns/:table', async (req, res) => {
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


// user authentication
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  // get token securely from cookie
  // used instead of header as cookie sent over http
  const token = req.cookies.token;

  // no token
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    // fail verification token
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

//signups
app.post('/api/register', async (req, res) => {
  try {
    // VARIABLE FOR FRONT END
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // hash the password using bcrypt
    const strength = await bcrypt.genSalt(10);
    const pw_hash = await bcrypt.hash(password, strength);

    const result = await pool.query(
      `INSERT INTO users (email, pw_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, name`,
      [email, pw_hash, role, name || '']
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // 23505 is postgres UNIQUE fail
      return res.status(409).json({ error: 'Email already in use' });
    }
    // default fail
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// login to already created act
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rows.length === 0) { // no account found
      return res.status(401).json({ error: 'Incorrect Email or Password' });
    }
    // row 0 keeps the user data found
    const user = result.rows[0];
    // entered password vs hashed password
    const validPassword = await bcrypt.compare(password, user.pw_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect Email or Password' });
    }
    // create jwt token by signing it, 24hr expiry
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // token now rests in http cookie
    res.cookie('token', token, {
      httpOnly: true,
      // uses the secure flag http(S) if hosting it normally (not on localhost)
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours cookie lifetime
      // cookie setting to prevent CSRF
      // https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
      sameSite: 'lax'
    });

    // dont need to include token in response, lives in cookie
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error('Login error FULL:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// logout to destroy cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// user profile info, GET
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    // DONT SEND PASSWORD
    const result = await pool.query(`SELECT id, email, role, name, created_at FROM users WHERE id = $1`, [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    // profile not found but with valid json token
    console.error('User profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/decks', async (req, res) => {
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

// get decks based on active and if invited to view them
app.get('/api/decks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT d.* 
      FROM decks d
      LEFT JOIN shared_deck_access sda ON d.id = sda.deck_id
      WHERE d.status = 'active' AND (d.user_id = $1 OR sda.user_id = $1)
      ORDER BY d.id ASC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get decks error:', err);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

//delete function for decks (so now it matches card deletion)
app.delete('/api/decks/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;

    const result = await pool.query(
      `
      UPDATE decks 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *;
      `,
      [deckId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.json({
      success: true,
      message: 'Deck soft-deleted successfully',
      deck: result.rows[0]
    });
  } catch (err) {
    console.error('Delete deck error:', err);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// rename deck title and/or description
app.patch('/api/decks/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const { title, description } = req.body;

    const deckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1 AND status = 'active'`,
      [deckId]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const existing = deckResult.rows[0];
    const updatedTitle = title ?? existing.title;
    const updatedDescription = description ?? existing.description;

    if (!updatedTitle.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const result = await pool.query(
      `
      UPDATE decks
      SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
      `,
      [updatedTitle, updatedDescription, deckId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Edit deck error:', err);
    res.status(500).json({ error: 'Failed to edit deck' });
  }
});

// create invite code for a deck
// code becomes invalid after 24hrs or if refreshed
app.post('/api/decks/:deckId/invite', authenticateToken, async (req, res) => {
  try {
    const { deckId } = req.params;

    if (req.user.role !== 'TEACH') {
      return res.status(403).json({ error: 'Only teachers are permitted to generate invite codes.' });
    }

    // whoami (just ownership though lol)
    const deckCheck = await pool.query(`SELECT id FROM decks WHERE id = $1 AND user_id = $2`, [deckId, req.user.id]);
    if (deckCheck.rows.length === 0) return res.status(403).json({ error: 'Deck not owned' });

    // 6 char code just using random fx
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await pool.query(
      `UPDATE decks SET invite_code = $1, invite_expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' WHERE id = $2 RETURNING invite_code, invite_expires_at`,
      [code, deckId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Generate invite error:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// use invite code to join a deck
app.post('/api/decks/join', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const deckResult = await pool.query(
      `SELECT id FROM decks WHERE invite_code = $1 AND invite_expires_at > CURRENT_TIMESTAMP`,
      [code.toUpperCase()]
    );

    if (deckResult.rows.length === 0) return res.status(404).json({ error: 'Invalid or expired code' });
    const deckId = deckResult.rows[0].id;

    await pool.query(
      `INSERT INTO shared_deck_access (user_id, deck_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, deckId]
    );

    res.json({ success: true, message: 'Successfully joined deck', deckId });
  } catch (err) {
    console.error('Join deck error:', err);
    res.status(500).json({ error: 'Failed to join deck' });
  }
});

app.post('/api/decks/:deckId/cards', async (req, res) => {
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

app.get('/api/decks/:deckId/cards', async (req, res) => {
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

app.patch('/api/cards/:cardId', async (req, res) => {
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


app.delete('/api/cards/:cardId', async (req, res) => {
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

app.post('/api/decks/:deckId/import', authenticateToken, async (req, res) => {
  try {
    const { deckId } = req.params;
    const { cards } = req.body;
    // imported array
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({
        error: 'cards array is required'
      });
    }

    // check ownership to not delete other users decks during import
    const deckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1 AND user_id = $2`,
      [deckId, req.user.id]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Deck not found or not owned'
      });
    }

    await pool.query('BEGIN');

    // delete existing cards
    await pool.query(
      `DELETE FROM flashcards WHERE deck_id = $1`,
      [deckId]
    );

    // insert new ones
    for (const card of cards) {
      if (!card.front || !card.back) {
        throw new Error('Invalid card payload. Missing term or definition.');
      }
      await pool.query(
        `
        INSERT INTO flashcards (deck_id, front, back)
        VALUES ($1, $2, $3)
        `,
        [deckId, card.front, card.back]
      );
    }

    // update deck timestamp
    await pool.query(
      `UPDATE decks SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [deckId]
    );
    await pool.query('COMMIT');

    res.json({ success: true, message: 'Deck imported successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Import deck error:', err);
    res.status(500).json({
      error: err.message === 'Invalid card payload. Missing front or back.' ? err.message : 'Failed to import deck'
    });
  }
});

app.post('/api/decks/:id/duplicate', async (req, res) => {
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

// create quiz
app.post('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const { deck_id, title, description } = req.body;

    if (!deck_id || !title) {
      return res.status(400).json({ error: 'deck_id and title are required' });
    }
    //user_id check here for ownership
    const deckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1 AND status = 'active' AND user_id = $2`,
      [deck_id, req.user.id]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found or not owned' });
    }

    const result = await pool.query(
      `
      INSERT INTO quizzes (deck_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [deck_id, title, description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// add question to quiz
app.post('/api/quizzes/:quizId/questions', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { question, option_a, option_b, option_c, option_d, correct_option } = req.body;

    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_option) {
      return res.status(400).json({ error: 'All question fields are required' });
    }

    const validOptions = ['A', 'B', 'C', 'D'];
    if (!validOptions.includes(correct_option)) {
      return res.status(400).json({ error: 'correct_option must be A, B, C, or D' });
    }
    // fix: JOIN decks verify ownership
    const quizResult = await pool.query(
      `SELECT q.* FROM quizzes q JOIN decks d ON q.deck_id = d.id WHERE q.id = $1 AND d.user_id = $2`,
      [quizId, req.user.id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or not owned' });
    }

    const result = await pool.query(
      `
      INSERT INTO quiz_questions
      (quiz_id, question, option_a, option_b, option_c, option_d, correct_option)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [quizId, question, option_a, option_b, option_c, option_d, correct_option]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add quiz question error:', err);
    res.status(500).json({ error: 'Failed to add quiz question' });
  }
});
// get all quizzes for one deck
app.get('/api/decks/:deckId/quizzes', authenticateToken, async (req, res) => {
  try {
    const { deckId } = req.params;

    // fix: check ownership or joined status before returning
    const deckResult = await pool.query(
      `
      SELECT d.id 
      FROM decks d 
      LEFT JOIN shared_deck_access sda ON d.id = sda.deck_id 
      WHERE d.id = $1 AND (d.user_id = $2 OR sda.user_id = $2)
      `,
      [deckId, req.user.id]
    );

    if (deckResult.rows.length === 0) {
      return res.status(403).json({ error: 'No access to this deck' });
    }


    const result = await pool.query(
      `SELECT * FROM quizzes WHERE deck_id = $1 ORDER BY id ASC`,
      [deckId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// get one quiz with questions, withholds correct answers
app.get('/api/quizzes/:quizId', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;

    //fix: join decks again and evaluate read access
    const quizResult = await pool.query(
      `
      SELECT q.* 
      FROM quizzes q 
      JOIN decks d ON q.deck_id = d.id 
      LEFT JOIN shared_deck_access sda ON d.id = sda.deck_id 
      WHERE q.id = $1 AND (d.user_id = $2 OR sda.user_id = $2)
      `,
      [quizId, req.user.id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or unaccessible' });
    }

    const questionsResult = await pool.query(
      `
      SELECT id, question, option_a, option_b, option_c, option_d
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY id ASC
      `,
      [quizId]
    );

    res.json({
      quiz: quizResult.rows[0],
      questions: questionsResult.rows
    });
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// submitting quiz route
app.post('/api/quizzes/:quizId/submit', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const questionsResult = await pool.query(
      `
      SELECT id, correct_option
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY id ASC
      `,
      [quizId]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    let score = 0;

    for (const question of questionsResult.rows) {
      const submittedAnswer = answers.find(
        (a) => Number(a.question_id) === question.id
      );

      if (submittedAnswer && submittedAnswer.selected_option === question.correct_option) {
        score++;
      }
    }

    const total_questions = questionsResult.rows.length;

    const attemptResult = await pool.query(
      `
      INSERT INTO quiz_attempts (quiz_id, user_id, score, total_questions)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [quizId, req.user.id, score, total_questions]
    );

    res.json({
      message: 'Quiz submitted successfully',
      score,
      total_questions,
      attempt: attemptResult.rows[0]
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// user's logged in quiz attempt history
app.get('/api/my-quiz-attempts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT qa.*, q.title AS quiz_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = $1
      ORDER BY qa.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get quiz attempts error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

// leaderboard from scores only included top 5 plus whichever user logged in
// score is defined as EACH attempts percent correct added onto each other
// leaderboard from scores - teachers see all and emails, students see top 5 + themselves
app.get('/api/decks/:deckId/leaderboard', authenticateToken, async (req, res) => {
  try {
    const deckId = Number(req.params.deckId);

  if (!Number.isInteger(deckId)) {
    return res.status(400).json({ error: 'Invalid deck id' });
}
    const isTeacher = req.user.role === 'TEACH';

    const query = `
      WITH user_points AS (
        SELECT 
          u.id AS user_id,
          u.name AS user_name,
          ${isTeacher ? 'u.email AS user_email,' : ''}
          SUM(COALESCE(ROUND((qa.score::numeric / NULLIF(qa.total_questions, 0)) * 1000), 0)) AS total_deck_points
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN users u ON qa.user_id = u.id
        WHERE q.deck_id = $1
        GROUP BY u.id, u.name${isTeacher ? ', u.email' : ''}
      ),
      ranked_points AS (
        SELECT 
          user_id,
          user_name,
          ${isTeacher ? 'user_email,' : ''}
          total_deck_points,
          RANK() OVER (ORDER BY total_deck_points DESC) as rank
        FROM user_points
      )
      SELECT * FROM ranked_points 
      ${isTeacher ? '' : 'WHERE rank <= 5 OR user_id = $2'}
      ORDER BY rank ASC, total_deck_points DESC, user_name ASC;
    `;

    const params = isTeacher ? [deckId] : [deckId, req.user.id];
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Get deck leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch deck leaderboard' });
  }
});

//allows for express and server to wait for client requests on the selected port
app.listen(port, () => {
  console.log(`StudyStrike running on http://localhost:${port}`);
  console.log(`Database test at http://localhost:${port}/db-test`);
});

// included nodemon as a node package to instantly update without restarting server
