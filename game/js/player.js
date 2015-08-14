/**
* BMQuest.player Module
*
* Description
*/
angular.module('BMQuest.player', [])
.factory('$player', ['$rootScope', function($rootScope){

	var self=this;

	var team=[
		{
			name:"湯尼",
			enemy:false,

			head:"img/tony.png",

			in_fight:true,

			attack_base:80,
			attack_dice:2,
			attack_variance:20,
			accuracy_rate:90,
			critical_rate:15,
			critical_multiplier:50,
			
			ultimate_stack:0,
			ultimate_skill:{
				target:1,
				damage_multiplier:2.5,
			},
			hp:4000,
			max_hp:4000,
			defense_point:8,
			evade:10,

			speed:24,
			bar_position:24,

			stand_position_line:0,
			stand_position_index:1,
		}
	]


	var getTeam=function(){
		return team;
	}

	var getFightTeam=function(){
		return _.filter(team,function(member){
			return member.in_fight
		})
	}

	self={
		getTeam:getTeam,
		getFightTeam:getFightTeam,
	}

	return self;
}])