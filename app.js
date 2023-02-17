const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertTheObject = (players) => {
  return {
    playerId: players.player_id,
    playerName: players.player_name,
  };
};

const matchConverted = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};
const getThePlayerDetails = (eachPlay) => {
  return {
    matchId: eachPlay.match_id,
    match: eachPlay.match,
    year: eachPlay.year,
  };
};

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//GET the players.....
app.get("/players/", async (request, response) => {
  const playersData = `
        SELECT
        *
        FROM
        player_details;`;
  const players = await db.all(playersData);
  response.send(players.map((each) => convertTheObject(each)));
});
//GET The player based on playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playersData = `
        SELECT
        *
        FROM
        player_details
        WHERE
        player_id = '${playerId}';`;
  const playersDb = await db.get(playersData);
  response.send(convertTheObject(playersDb));
});
//update the data based on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
        UPDATE
        player_details
        SET
        player_id = '${playerId}',
        player_name = '${playerName}'
        WHERE
        player_id = ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});
//GET the data from match details(API-4)
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const matchDetails = await db.get(matchQuery);
  response.send(matchConverted(matchDetails));
});
//API-5/..............
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playersMatchesQuery = `
    SELECT
    *
    FROM
    player_match_score
    NATURAL JOIN
    match_details
    WHERE
    player_id = '${playerId}';`;
  const playerData = await db.all(playersMatchesQuery);
  response.send(playerData.map((eachPlay) => getThePlayerDetails(eachPlay)));
});
//API-6........
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});
//API-7.......
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalScoreQuery = `
        SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        FROM
        player_details
        NATURAL JOIN
        player_match_score
        WHERE
        player_id = '${playerId}';`;
  const dataQuery = await db.get(totalScoreQuery);
  response.send(dataQuery);
});
module.exports = app;
