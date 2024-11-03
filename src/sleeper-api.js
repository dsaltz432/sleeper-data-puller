const axios = require('axios');

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';
const DANIEL_USER_ID = '602572680327135232';

const makeRequest = async(path) => {
  const url = `${SLEEPER_BASE_URL}${path}`;
  const response = await axios.get(url);
  return response.data;
};

const getPlayersMap = async() => {
  const response = await makeRequest('/players/nfl');
  const playersMap = {};
  for (const [playerId, playerData] of Object.entries(response)) {
    playersMap[playerId] = `${playerData.first_name} ${playerData.last_name}`;
  }
  return playersMap;
};

const getCurrentLeagueId = async(currentYear) => {
  const response = await makeRequest(`/user/${DANIEL_USER_ID}/leagues/nfl/${currentYear}`);
  const league = response.filter(league => league.name === 'The last league');
  return league[0].league_id;
};

const getLeagueMatchups = async({ leagueId, week }) => {
  return await makeRequest(`/league/${leagueId}/matchups/${week}`);
};

const getLeagueRosters = async(leagueId) => {
  return await makeRequest(`/league/${leagueId}/rosters`);
};

const getLeagueUsers = async(leagueId) => {
  return await makeRequest(`/league/${leagueId}/users`);
};

const getNflState = async() => {
  return await makeRequest('/state/nfl');
};


module.exports = {
  getPlayersMap,
  getCurrentLeagueId,
  getLeagueMatchups,
  getLeagueRosters,
  getLeagueUsers,
  getNflState,
};
