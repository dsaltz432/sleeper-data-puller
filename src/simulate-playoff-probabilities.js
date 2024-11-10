const _ = require('lodash');

const getHistoricalPointsPerTeam = (teams, matchupsBreakdown, currentWeek) => {
  const historicalPointsPerTeam = {};
  for (const team of teams) {
    historicalPointsPerTeam[team.rosterId] = [];
  }
  for (const { week, matchups } of matchupsBreakdown) {
    // Only process weeks that have been completed
    if (week >= currentWeek) {
      continue;
    }
    for (const matchupPair of matchups) {
      const matchupTeamA = matchupPair[0];
      const matchupTeamB = matchupPair[1];
      const teamA = teams.find(team => team.rosterId === matchupTeamA.rosterId);
      const teamB = teams.find(team => team.rosterId === matchupTeamB.rosterId);
      historicalPointsPerTeam[teamA.rosterId].push(matchupTeamA.totalPoints);
      historicalPointsPerTeam[teamB.rosterId].push(matchupTeamB.totalPoints);
    }
  }
  return historicalPointsPerTeam;
};

// Function to extract the remaining schedule from matchupsData
const extractRemainingSchedule = (matchupsBreakdown, currentWeek) => {
  const remainingSchedule = [];

  matchupsBreakdown.forEach(({ week: weekNumber, matchups }) => {
    // Only process weeks from the current week onwards
    if (weekNumber < currentWeek) return;

    matchups.forEach((matchupPair) => {
      if (matchupPair.length !== 2) {
        console.warn(`Invalid matchup data for week ${weekNumber}`);
        return;
      }

      const [teamAData, teamBData] = matchupPair;
      const teamARosterId = teamAData.rosterId;
      const teamBRosterId = teamBData.rosterId;

      if (teamARosterId === undefined || teamBRosterId === undefined) {
        console.error(`Could not find rosterId for teams in week ${weekNumber}`);
        return;
      }

      // Extract precomputed win probabilities
      const winProbA = teamAData.winProbability;
      const winProbB = teamBData.winProbability;

      if (winProbA === undefined || winProbB === undefined) {
        console.error(`Win probabilities not found for matchup between rosterId ${teamARosterId} and ${teamBRosterId}`);
        return;
      }

      // Ensure probabilities sum to approximately 1
      const totalProb = winProbA + winProbB;
      if (Math.abs(totalProb - 1) > 0.01) {
        console.warn(`Win probabilities for matchup between rosterId ${teamARosterId} and ${teamBRosterId} do not sum to 1`);
      }

      remainingSchedule.push({
        week: weekNumber,
        teamA: teamARosterId,
        teamB: teamBRosterId,
        winProbA, // Use the precomputed win probability
      });
    });
  });

  return remainingSchedule;
};

// Function to simulate a single season
const simulateSeason = (teams, remainingSchedule, historicalPointsPerTeam) => {
  // Deep copy of teams
  const simulatedStandings = teams.map((team) => {
    const historicalPoints = historicalPointsPerTeam[team.rosterId];
    const gamesPlayed = team.wins + team.losses + team.ties;

    // Calculate mean and standard deviation
    const mean = historicalPoints.reduce((sum, val) => sum + val, 0) / gamesPlayed;
    const variance = historicalPoints.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gamesPlayed;
    const stdDev = Math.sqrt(variance);

    return {
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      pointsFor: team.pointsFor,
      rosterId: team.rosterId,
      shortName: team.shortName,
      meanPoints: mean,
      stdDevPoints: stdDev || mean * 0.15, // Fallback to 15% of mean if stdDev is zero
    };
  });

  // Function to generate a random number from a normal distribution
  const randomNormal = (mean, stdDev) => {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num * stdDev + mean;
    return num;
  };

  // Simulate each remaining game
  remainingSchedule.forEach((matchup) => {
    const teamA = simulatedStandings.find((team) => team.rosterId === matchup.teamA);
    const teamB = simulatedStandings.find((team) => team.rosterId === matchup.teamB);

    if (!teamA || !teamB) {
      console.error(`Could not find teams for rosterId ${matchup.teamA} or ${matchup.teamB}`);
      return;
    }

    // Simulate points scored by each team using their historical mean and standard deviation
    const simulatePoints = (team) => {
      const mean = team.meanPoints;
      const stdDev = team.stdDevPoints;
      return Math.max(0, randomNormal(mean, stdDev));
    };

    const teamAPoints = simulatePoints(teamA);
    const teamBPoints = simulatePoints(teamB);

    // Update pointsFor for each team
    teamA.pointsFor += teamAPoints;
    teamB.pointsFor += teamBPoints;

    // Determine game outcome based on points scored
    if (teamAPoints > teamBPoints) {
      teamA.wins += 1;
      teamB.losses += 1;
    } else if (teamBPoints > teamAPoints) {
      teamB.wins += 1;
      teamA.losses += 1;
    } else {
      // In case of a tie, decide based on win probability
      const rand = Math.random();
      if (rand < matchup.winProbA) {
        teamA.wins += 1;
        teamB.losses += 1;
      } else {
        teamB.wins += 1;
        teamA.losses += 1;
      }
    }
  });

  // Sort teams by win percentage and points for
  return _.orderBy(simulatedStandings, ['wins', 'pointsFor'], ['desc', 'desc']);
};

const determinePlayoffTeams = (simulatedStandings) => {
  // Sort teams based on simulated wins and pointsFor as tiebreaker
  const sortedStandings = _.orderBy(simulatedStandings, ['wins', 'pointsFor'], ['desc', 'desc']);

  // Top 5 teams make playoffs based on record
  const top5Teams = sortedStandings.slice(0, 5);
  top5Teams.forEach(team => {
    team.madePlayoffsFromRecord = true;
  });

  // The 6th spot goes to the team with the highest pointsFor among remaining teams
  const remainingTeams = sortedStandings.slice(5);
  const teamWithHighestPointsFor = _.maxBy(remainingTeams, 'pointsFor');
  teamWithHighestPointsFor.madePlayoffsFromJordanRule = true;

  // Return all playoff teams
  return [...top5Teams, teamWithHighestPointsFor];
};

// Main function to simulate playoff probabilities
const simulatePlayoffProbabilities = (teams, matchupsBreakdown, currentWeek, numSimulations) => {
  // Initialize playoff appearance counts
  const playoffCounts = {};
  teams.forEach((team) => {
    playoffCounts[team.rosterId] = {
      madePlayoffCount: 0,
      madePlayoffFromRecordCount: 0,
      madePlayoffFromJordanRuleCount: 0,
    };
  });

  // Extract historical points per team
  const historicalPointsPerTeam = getHistoricalPointsPerTeam(teams, matchupsBreakdown, currentWeek);

  // Extract the remaining schedule with win probabilities
  const remainingSchedule = extractRemainingSchedule(matchupsBreakdown, currentWeek);

  // Start simulations
  const simulatedSeasons = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    // Simulate a season
    const simulatedStandings = simulateSeason(teams, remainingSchedule, historicalPointsPerTeam);

    // Determine playoff teams
    const playoffTeams = determinePlayoffTeams(simulatedStandings);

    // Update playoff counts
    playoffTeams.forEach((team) => {
      playoffCounts[team.rosterId].madePlayoffCount += 1;
      if (team.madePlayoffsFromRecord) {
        playoffCounts[team.rosterId].madePlayoffFromRecordCount += 1;
      } else if (team.madePlayoffsFromJordanRule) {
        playoffCounts[team.rosterId].madePlayoffFromJordanRuleCount += 1;
      }
    });

    // Store simulated standings
    simulatedSeasons.push(simulatedStandings);
  }

  // Calculate probabilities per team
  const playoffProbabilitiesPerTeam = {};
  teams.forEach((team) => {
    const playoffData = playoffCounts[team.rosterId];
    playoffProbabilitiesPerTeam[team.rosterId] = {
      madePlayoffProbability: playoffData.madePlayoffCount / numSimulations,
      madePlayoffFromRecordProbability: playoffData.madePlayoffFromRecordCount / numSimulations,
      madePlayoffFromJordanRuleProbability: playoffData.madePlayoffFromJordanRuleCount / numSimulations,
    };
  });

  return {
    playoffProbabilitiesPerTeam,
    simulatedSeasons,
  };
};

module.exports = {
  simulatePlayoffProbabilities,
};
