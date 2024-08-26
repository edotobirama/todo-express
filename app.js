const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const db_path = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDB = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDB()

const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE todo
    (
      id INTEGER,
      todo TEXT,
      priority TEXT,
      status TEXT
    );
  `
  await db.run(createTableQuery)
}

createTable()

app.get('/todos/', async (request, response) => {
  let {status = 'NA', priority = 'NA', search_q = ''} = request.query
  status = decodeURIComponent(status).replace(/%20/g, ' ')
  let query = ''

  if (status === 'NA' && priority === 'NA') {
    query = `
    SELECT *
    FROM todo
    WHERE todo LIKE "%${search_q}%";
  `
  } else if (status === 'NA' && priority !== 'NA') {
    query = `
    SELECT *
    FROM todo
    WHERE todo LIKE "%${search_q}%" AND priority = '${priority}';
  `
  } else if (status !== 'NA' && priority === 'NA') {
    query = `
    SELECT *
    FROM todo
    WHERE todo LIKE "%${search_q}%" AND status = '${status}';
  `
  } else {
    query = `
    SELECT *
    FROM todo
    WHERE todo LIKE "%${search_q}%" AND status = '${status}' AND priority = '${priority}';
  `
  }

  const resObject = await db.all(query)
  response.send(resObject)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `
    SELECT *
    FROM todo
    WHERE id = ${todoId} ;
  `
  const resObject = await db.get(query)
  response.send(resObject)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const query = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(${id} ,"${todo}","${priority}","${status}");
  `
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let {status = 'NA', priority = 'NA', todo = 'NA'} = request.body
  status = decodeURIComponent(status).replace(/%20/g, ' ')
  let query = ''
  let updated = ''
  if (status !== 'NA') {
    query = `
    UPDATE todo
    SET status = "${status}"
    WHERE id = ${todoId} ;
  `
    updated = 'Status'
  } else if (priority !== 'NA') {
    query = `
    UPDATE todo
    SET priority = "${priority}" 
    WHERE id = ${todoId};
  `
    updated = 'Priority'
  } else {
    query = `
    UPDATE todo
    SET todo = "${todo}" 
    WHERE id = ${todoId};
  `
    updated = 'Todo'
  }
  await db.run(query)
  response.send(`${updated} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `
    DELETE
    FROM todo
    WHERE id = ${todoId} ;
  `
  await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
