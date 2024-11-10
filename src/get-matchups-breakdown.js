const sleeper = require('./sleeper-api');

const REGULAR_SEASON_WEEKS = 14;

const getMatchupsBreakdown = async(teams, leagueId, playersMap, currentWeek) => {
  const breakdown = [];

  for (let week = 1; week <= REGULAR_SEASON_WEEKS; week++) {
    const rawMatchups = await sleeper.getLeagueMatchups({ leagueId, week });
    const matchups = formatMatchups({ teams, matchups: rawMatchups, playersMap, week, currentWeek });
    breakdown.push({ week, matchups });
  }

  return breakdown;
};

const formatMatchups = ({ teams, matchups, playersMap, week, currentWeek }) => {

  const isFutureOrCurrentWeek = week >= currentWeek;

  const groupedMatchups = {};

  // Iterate through each matchup in the response
  for (const matchup of matchups) {

    const newMatchup = {
      // Use 0 points if it's still the current week of a future week. We don't want to show the current week's points until the games are played.
      totalPoints: isFutureOrCurrentWeek ? 0 : matchup.points,
    };

    // Map player IDs to player names for the 'starters' array
    const startingPlayers = [];
    for (const id of matchup.starters) {
      const name = playersMap[id] || id;
      startingPlayers.push(name);
    }

    // Determine starting and bench points
    newMatchup.startingPoints = {};
    newMatchup.benchPoints = {};
    for (const [id, points] of Object.entries(matchup.players_points)) {
      const name = playersMap[id] || id;
      if (startingPlayers.includes(name)) {
        newMatchup.startingPoints[name] = isFutureOrCurrentWeek ? 0 : points;
      } else {
        newMatchup.benchPoints[name] = isFutureOrCurrentWeek ? 0 : points;
      }
    }

    // Attach the user_id based on the roster_id
    const team = teams.find((team) => team.rosterId === matchup.roster_id);
    newMatchup.userId = team.userId;
    newMatchup.shortName = team.shortName;
    newMatchup.rosterId = team.rosterId; // Add rosterId for easier access

    // If the matchup_id key doesn't exist in groupedMatchups, create an empty array for it
    if (!groupedMatchups[matchup.matchup_id]) {
      groupedMatchups[matchup.matchup_id] = [];
    }

    // Add the current matchup to the appropriate group
    groupedMatchups[matchup.matchup_id].push(newMatchup);
  }

  return Object.values(groupedMatchups);
};

module.exports = {
  getMatchupsBreakdown,
};
