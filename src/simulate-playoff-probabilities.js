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
      overallRating: team.overallRating,
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

  // Sort teams by wins and pointsFor
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

// Function to calculate win probability between two teams based on overall ratings
const calculateWinProbability = (ratingA, ratingB) => {
  return ratingA / (ratingA + ratingB);
};

// Function to simulate the playoffs and determine the champion
const simulatePlayoffs = (playoffTeams) => {
  // Organize teams by seed
  const teamsBySeed = {};
  playoffTeams.forEach(team => {
    teamsBySeed[team.seed] = team;
  });

  // Round 1: Wildcard Round
  // Matchup 1: Seed 3 vs Seed 6
  const seed3 = teamsBySeed[3];
  const seed6 = teamsBySeed[6];

  const probSeed3Wins = calculateWinProbability(seed3.overallRating, seed6.overallRating);
  const winnerMatchup1 = (Math.random() < probSeed3Wins) ? seed3 : seed6;

  // Matchup 2: Seed 4 vs Seed 5
  const seed4 = teamsBySeed[4];
  const seed5 = teamsBySeed[5];

  const probSeed4Wins = calculateWinProbability(seed4.overallRating, seed5.overallRating);
  const winnerMatchup2 = (Math.random() < probSeed4Wins) ? seed4 : seed5;

  // Round 2: Semifinals
  // Matchup 3: Seed 1 vs Winner of Matchup 2
  const seed1 = teamsBySeed[1];
  const probSeed1Wins = calculateWinProbability(seed1.overallRating, winnerMatchup2.overallRating);
  const winnerMatchup3 = (Math.random() < probSeed1Wins) ? seed1 : winnerMatchup2;

  // Matchup 4: Seed 2 vs Winner of Matchup 1
  const seed2 = teamsBySeed[2];
  const probSeed2Wins = calculateWinProbability(seed2.overallRating, winnerMatchup1.overallRating);
  const winnerMatchup4 = (Math.random() < probSeed2Wins) ? seed2 : winnerMatchup1;

  // Round 3: Finals
  const probFinalWin = calculateWinProbability(winnerMatchup3.overallRating, winnerMatchup4.overallRating);
  const champion = (Math.random() < probFinalWin) ? winnerMatchup3 : winnerMatchup4;

  return champion;
};
// Updated Function to Simulate the Loser Bowl
const simulateLoserBowl = (loserBowlTeams) => {
  // Organize teams by seed (worst seed gets the highest number)
  const teamsBySeed = {};
  loserBowlTeams.forEach(team => {
    teamsBySeed[team.seed] = team;
  });

  // Round 1: Seeds 7 vs 10 and 8 vs 9
  const seed7 = teamsBySeed[7];
  const seed10 = teamsBySeed[10];
  const seed8 = teamsBySeed[8];
  const seed9 = teamsBySeed[9];

  const probSeed7Loses = calculateWinProbability(seed10.overallRating, seed7.overallRating);
  const loserMatchup1 = (Math.random() < probSeed7Loses) ? seed7 : seed10;

  const probSeed8Loses = calculateWinProbability(seed9.overallRating, seed8.overallRating);
  const loserMatchup2 = (Math.random() < probSeed8Loses) ? seed8 : seed9;

  // Round 2: Seed 11 vs Loser of Matchup 1, Seed 12 vs Loser of Matchup 2
  const seed11 = teamsBySeed[11];
  const seed12 = teamsBySeed[12];

  const probSeed11Loses = calculateWinProbability(loserMatchup1.overallRating, seed11.overallRating);
  const loserMatchup3 = (Math.random() < probSeed11Loses) ? seed11 : loserMatchup1;

  const probSeed12Loses = calculateWinProbability(loserMatchup2.overallRating, seed12.overallRating);
  const loserMatchup4 = (Math.random() < probSeed12Loses) ? seed12 : loserMatchup2;

  // Round 3: Final Match between losers of Round 2
  const probFinalLoses = calculateWinProbability(loserMatchup4.overallRating, loserMatchup3.overallRating);
  const loserBowlChampion = (Math.random() < probFinalLoses) ? loserMatchup3 : loserMatchup4;

  return loserBowlChampion;
};

// Main function to simulate playoff probabilities
const simulatePlayoffProbabilities = (teams, matchupsBreakdown, currentWeek, numSimulations) => {
  // Initialize counts
  const playoffCounts = {};
  const championshipCounts = {};
  const loserBowlCounts = {};

  teams.forEach((team) => {
    playoffCounts[team.rosterId] = {
      madePlayoffCount: 0,
      madePlayoffFromRecordCount: 0,
      madePlayoffFromJordanRuleCount: 0,
    };
    championshipCounts[team.rosterId] = 0;
    loserBowlCounts[team.rosterId] = 0;
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

    // Assign seeds to playoff teams based on their standings
    const seededPlayoffTeams = _.orderBy(playoffTeams, ['wins', 'pointsFor'], ['desc', 'desc']).map((team, index) => {
      return { ...team, seed: index + 1 };
    });

    // Update playoff counts
    seededPlayoffTeams.forEach((team) => {
      playoffCounts[team.rosterId].madePlayoffCount += 1;
      if (team.madePlayoffsFromRecord) {
        playoffCounts[team.rosterId].madePlayoffFromRecordCount += 1;
      } else if (team.madePlayoffsFromJordanRule) {
        playoffCounts[team.rosterId].madePlayoffFromJordanRuleCount += 1;
      }
    });

    // Simulate playoffs
    const champion = simulatePlayoffs(seededPlayoffTeams);

    // Update championship counts
    championshipCounts[champion.rosterId] += 1;

    // Determine Loser Bowl Teams
    const playoffRosterIds = new Set(seededPlayoffTeams.map(team => team.rosterId));
    const nonPlayoffTeams = simulatedStandings.filter(team => !playoffRosterIds.has(team.rosterId));

    // Assign seeds to Loser Bowl teams (from 7 to 12, worst seed gets highest number)
    const seededLoserBowlTeams = _.orderBy(nonPlayoffTeams, ['wins', 'pointsFor'], ['asc', 'asc']).map((team, index) => {
      return { ...team, seed: index + 7 }; // Seeds from 7 to 12
    });

    // Simulate Loser Bowl
    const loserBowlChampion = simulateLoserBowl(seededLoserBowlTeams);

    // Update Loser Bowl counts
    loserBowlCounts[loserBowlChampion.rosterId] += 1;

    // Store simulated standings
    simulatedSeasons.push(simulatedStandings);
  }

  // Calculate probabilities per team
  const playoffProbabilitiesPerTeam = {};
  const championshipProbabilitiesPerTeam = {};
  const loserBowlProbabilitiesPerTeam = {};

  teams.forEach((team) => {
    const playoffData = playoffCounts[team.rosterId];
    playoffProbabilitiesPerTeam[team.rosterId] = {
      madePlayoffProbability: playoffData.madePlayoffCount / numSimulations,
      madePlayoffFromRecordProbability: playoffData.madePlayoffFromRecordCount / numSimulations,
      madePlayoffFromJordanRuleProbability: playoffData.madePlayoffFromJordanRuleCount / numSimulations,
    };
    // Championship probability
    championshipProbabilitiesPerTeam[team.rosterId] = championshipCounts[team.rosterId] / numSimulations;
    // Loser Bowl probability
    loserBowlProbabilitiesPerTeam[team.rosterId] = loserBowlCounts[team.rosterId] / numSimulations;
  });

  return {
    playoffProbabilitiesPerTeam,
    championshipProbabilitiesPerTeam,
    loserBowlProbabilitiesPerTeam,
    simulatedSeasons,
  };
};

module.exports = {
  simulatePlayoffProbabilities,
};
