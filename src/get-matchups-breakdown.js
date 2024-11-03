const sleeper = require('./sleeper-api');

const REGULAR_SEASON_WEEKS = 14;


const getMatchupsBreakdown = async({ leagueId, standings, playersMap, currentWeek }) => {
  const previousMatchups = [];
  const currentMatchups = [];
  const futureMatchups = [];

  for (let week = 1; week <= REGULAR_SEASON_WEEKS; week++) {
    const rawMatchups = await sleeper.getLeagueMatchups({ leagueId, week });
    const isCurrentWeek = currentWeek === week;
    const matchups = formatMatchups({ standings, matchups: rawMatchups, playersMap, isCurrentWeek });

    if (week < currentWeek) {
      previousMatchups.push({ week, matchups });
    } else if (week === currentWeek) {
      currentMatchups.push({ week, matchups });
    } else {
      futureMatchups.push({ week, matchups });
    }
  }

  return {
    previousMatchups,
    currentMatchups,
    futureMatchups,
  };
};

const formatMatchups = ({ standings, matchups, playersMap, isCurrentWeek }) => {

  const groupedMatchups = {};

  // Iterate through each matchup in the response
  for (const matchup of matchups) {
    const newMatchup = {
      // Use 0 points if it's still the current week. We don't want to show the current week's points until the games are played.
      totalPoints: isCurrentWeek ? 0 : matchup.points,
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
        newMatchup.startingPoints[name] = isCurrentWeek ? 0 : points;
      } else {
        newMatchup.benchPoints[name] = isCurrentWeek ? 0 : points;
      }
    }

    // If the matchup_id key doesn't exist in groupedMatchups, create an empty array for it
    if (!groupedMatchups[matchup.matchup_id]) {
      groupedMatchups[matchup.matchup_id] = [];
    }

    // Attach the user_id based on the roster_id
    const user = standings.find((row) => row.rosterId === matchup.roster_id);
    newMatchup.userId = user.userId;
    newMatchup.shortName = user.shortName;

    // Add the current matchup to the appropriate group
    groupedMatchups[matchup.matchup_id].push(newMatchup);
  }


  return Object.values(groupedMatchups);
};

module.exports = {
  getMatchupsBreakdown,
};
