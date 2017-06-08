module.exports = {
	Game: function(){
		this.minutes = 0;
		this.seconds = 0;
		var team1 = require('./config/Team1.json');
		var team2 = require('./config/Team2.json');
		var actions = require('./config/Actions.json');
		var playerActions = require('./config/PlayerActions.json');
		var positions = require('./config/Positions.json');

		function selectFromBaseChance(items, playerStats, defenderStats, targetPlayerStats, targetDefenderStats, ownTactics, enemyTactics){
			var sum = 0;
			items.forEach(function(item){
				sum += getChance(item);
			})
			var randomNumber = Math.random()*sum;
			var cumulatedChance = 0;
			for (var i = 0; i < items.length; i++) {
				if(cumulatedChance + getChance(items[i]) > randomNumber){
					break;
				}
				cumulatedChance += getChance(items[i]);
			}
			return items[i];

			function getChance(item){
				var chance = item.baseChance;
				if(item.modifiers){
					item.modifiers.forEach(function(modifier){
						var source;
						switch (modifier.source){
							case "P":
							source = playerStats;
							break;
							case "D":
							source = defenderStats;
							break;
							case "tP":
							source = targetPlayerStats;
							break;
							case "tD":
							source = targetDefenderStats;
							break;
							case "oT":
							source = ownTactics;
							break;
							case "eT":
							source = enemyTactics;
							break;
						}
						var factor = modifier.factor || 1;
						chance += Math.floor(factor * source[modifier.value]);
					});
				}
				if(chance < 0){
					return 0;
				}
				return chance;
			}
		}

		function getDefenderPosition(positionWithBall, team){
			var possibleDefensePositions = positions[positionWithBall].defenders;
			if(!possibleDefensePositions){
				return; // no defender for goalkeeper
			}
			var validatedDefensePositions = [];
			possibleDefensePositions.forEach(function(possibleDefensePosition){
				if(team[possibleDefensePosition.position]){
					validatedDefensePositions.push(possibleDefensePosition);
				}
			});
			return selectFromBaseChance(validatedDefensePositions).position;
		}

		function getValidOutcomes(outcomes, defender, targetDefender){
			var validOutcomes = [];
			outcomes.forEach(function(outcome){
				if(outcome.playerWithBall === "D" && defender === undefined){
					return;
				}
				if(outcome.playerWithBall === "tD" && targetDefender === undefined){
					return;
				}
				validOutcomes.push(outcome);
			});
			return validOutcomes;
		}
		this.addSeconds = function(addSeconds){
			var totalSeconds = this.seconds + addSeconds;
			var addMinutes = Math.floor(totalSeconds / 60);
			this.minutes += addMinutes;
			this.seconds = totalSeconds - (addMinutes*60);
		}
		this.getPlays = function(){
			var plays = [];
			var positionWithBall = "TW";
			var teamWithBall = team1;
			var teamWithOutBall = team2;
			while(playerActions[positionWithBall] && this.minutes <= 90){
				this.addSeconds(10 + Math.random()*30);
				var playerWithBall = teamWithBall[positionWithBall]
				var playerAction = selectFromBaseChance(playerActions[positionWithBall], playerWithBall.stats);
				var defenderPosition = getDefenderPosition(positionWithBall, teamWithOutBall);
				var defender = teamWithOutBall[defenderPosition];
				var action = actions[playerAction.type];
				var targetPosition = selectFromBaseChance(playerAction.targets, playerWithBall).position;
				var targetPlayer = teamWithBall[targetPosition];
				var targetDefenderPosition = getDefenderPosition(targetPosition, teamWithOutBall);
				var targetDefender = teamWithOutBall[targetDefenderPosition];
				var validOutcomes = getValidOutcomes(action.outcomes, defender, targetDefender);
				var outcome = selectFromBaseChance(action.outcomes, playerWithBall.stats, undefined, targetPlayer.stats); 

				var play = {
					minutes: this.minutes,
					seconds: this.seconds,
					position : positionWithBall,
					name : teamWithBall[positionWithBall].name,
					action : action.description,
					targetPosition : targetPosition,
					targetName: teamWithBall[targetPosition].name,
					outcome: outcome.description,
					defender: defender,
					defenderPosition: defenderPosition,
					targetDefender: targetDefender,
					targetDefenderPosition: targetDefenderPosition
				};
				plays.push(play);

				// setup new play
				switch (outcome.playerWithBall) {
					case "P" : 
						break;
					case "tP" : 
						positionWithBall = targetPosition;
						break;
					case "D" : 
						positionWithBall = defenderPosition;
						var oldTeamWithBall = teamWithBall;
						teamWithBall = teamWithOutBall;
						teamWithOutBall = oldTeamWithBall;
						break;
					case "tD" : 
						positionWithBall = targetDefenderPosition;
						var oldTeamWithBall = teamWithBall;
						teamWithBall = teamWithOutBall;
						teamWithOutBall = oldTeamWithBall;
						break;
				}			
			}
			return plays;
		};
	}	
};