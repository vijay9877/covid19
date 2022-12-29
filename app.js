const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const databasePath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

convertingDbObjectToResponseStateObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

convertingDbObjectToResponsiveDistrictObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.cured,
    deaths: dbObject.deaths,
  };
};

//api 1

app.get("/states/", async (request, response) => {
  const stateDetailsQuery = `
    SELECT
        *
    FROM 
        state;`;
  const stateDetailsQueryResponse = await database.all(stateDetailsQuery);
  response.send(
    stateDetailsQueryResponse.map((eachItem) =>
      convertingDbObjectToResponseStateObject(eachItem)
    )
  );
});

//api 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesOfStateIdQuery = `
    SELECT
        *
    FROM 
        state
    WHERE 
        state_id = '${stateId}';`;
  const stateOfStateIdQueryResponse = await database.get(statesOfStateIdQuery);
  response.send(
    convertingDbObjectToResponseStateObject(stateOfStateIdQueryResponse)
  );
});

//api 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDetailsQuery = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES
        ( '${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  await database.run(postDetailsQuery);
  response.send("District Successfully Added");
});

//api 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsOfGivenDistrictIDQuery = `
    SELECT
        *
    FROM 
        district
    WHERE
        district_id = '${districtId}';`;
  const getDistrictsOfGivenDistrictIDQueryRespnse = await database.all(
    getDistrictsOfGivenDistrictIDQuery
  );
  response.send(
    convertingDbObjectToResponsiveDistrictObject(
      getDistrictsOfGivenDistrictIDQueryRespnse
    )
  );
});

//api 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletingDistrictIdQuery = `
    DELETE FROM
        district
    WHERE
        district_id = '${districtId}';`;
  await database.run(deletingDistrictIdQuery);
  response.send("District Removed");
});

//api 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, state, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updatingGivenDetailsQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'
    WHERE 
        district_id = '${districtId}';`;
  await database.run(updatingGivenDetailsQuery);
  response.send("District Details Updated");
});

//api 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const detailsOfStateByStatsIdQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id = '${stateId}';`;
  const stats = await database.get(detailsOfStateByStatsIdQuery);

  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//api 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateOfGivenDistrictIdQuery = `
    SELECT
        state.state_name
    FROM state
        INNER JOIN district 
    ON state.state_id = district.state_id
    WHERE
        district.district_id = '${districtId}';`;
  const stateOfGivenDistrictIdQueryResponse = await database.all(
    stateOfGivenDistrictIdQuery
  );
  response.send(
    stateOfGivenDistrictIdQueryResponse.map((eachState) => ({
      stateName: eachState.state_name,
    }))
  );
});

module.exports = app;
