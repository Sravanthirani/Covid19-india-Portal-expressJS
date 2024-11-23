const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')
const jwt = require('jsonwebtoken')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//authenticationTokennn
const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

// User Register API
/*
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT 
      * 
    FROM 
      user 
    WHERE 
      username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`
    await db.run(createUserQuery)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})*/

// User Login API--1
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT
      *
    FROM
      user
    WHERE 
      username = '${username}';`
  const dbUser = await db.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})

      response.send('Login Success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// API 2
app.get('/states/', authenticateToken, async (request, response) => {
  const getStateQuery = `
            SELECT
              *
            FROM
              state
            ORDER BY
              state_id;`
  const statesArray = await db.all(getStateQuery)
  response.send(statesArray)
})

//API--3

app.get('/states/:state_id/', authenticateToken, async (request, response) => {
  const {state_id} = request.params
  const getStateQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${state_id};`
  const state = await db.get(getStateQuery)
  response.send(state)
})

//API-4
app.post('/districts/', authenticateToken, async (request, response) => {
  const {district_id, district_name, state_id, cases, cured, active, deaths} =
    request.body
  const createDistrictrQuery = `
     INSERT INTO
      district (district_id, district_name, state_id, cases, cured, active, deaths)
     VALUES
      (
       '${district_id}',
       '${district_name}',
       '${state_id}',
       '${cases}',
       '${cured}',
       '${active}'
       ,'${deaths}' 
      );`
  await db.run(createDistrictrQuery)
  response.send('District Successfully Added')
})

//API-5
app.get(
  '/districts/:district_id/',
  authenticateToken,
  async (request, response) => {
    const {district_id} = request.params
    const getDistrictQuery = `
    SELECT
      *
    FROM
      district 
    WHERE
      district_id = ${district_id};`
    const district = await db.get(getDistrictQuery)
    response.send(district)
  },
)

//API-6
app.delete(
  '/districts/:district_id/',
  authenticateToken,
  async (request, response) => {
    const {district_id} = request.params
    const deletedistrictuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${district_id};`
    await db.run(deletedistrictuery)
    response.send('District Removed')
  },
)

//API-7
app.put(
  '/districts/:district_id/',
  authenticateToken,
  async (request, response) => {
    const {district_id} = request.params
    const {district_name, state_id, cases, cured, active, deaths} = request.body
    const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name=${district_name}, state_id=${state_id}, cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths}
    WHERE
      district_id = ${district_id};`
    await db.run(updateDistrictQuery)
    response.send('District Details Updated')
  },
)

//API-8
app.get(
  '/states/:state_id/stats',
  authenticateToken,
  async (request, response) => {
    const {state_id} = request.params
    const api8 = `SELECT SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths 
  FROM district 
  WHERE state_id = '${state_id}';`
    const ans = await db.get(api8)
    response.send(ans)
  },
)

module.exports = app
