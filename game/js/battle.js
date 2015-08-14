/**
* BMQuest.battle Module
*
* Description
*/
angular.module('BMQuest.battle', []).
directive('battleLog',function(){
	return {
		restrict:"E",
		replace:true,
		template:"<div style='height:100%;position:absolute;overflow-y:scroll;width:200px;right:0;top:0;'></div>",
		link:function(scope, element, attrs){
			scope.$on('battle_log:update',function(ev,log){
				element.append('<p style="font-size:12px;">'+log+'</p>');
			})
		}
	}
})

.factory('$enemy', ['$rootScope','$http','$q', function($rootScope,$http,$q){

	var self=this;

	var enemyDB;

	var initEnemy=function(){

		var q=$q.defer();

		$http.get('/db/enemy.json').success(function(data){

			q.resolve();

			console.log(data);
			enemyDB=data;
		}).error(function(err){
			q.reject();
			console.log(err)
		})

		return q.promise;
	}

	var getEnemyProto=function(index){
		if (enemyDB) {
			return enemyDB[index];
		}
	}

	self={
		initEnemy:initEnemy,
		getEnemyProto:getEnemyProto,getEnemyProto
	}

	return self;
}])

.factory('$battle', ['$q','$rootScope','$interval','$enemy','$player', function($q,$rootScope,$interval,$enemy,$player){

	var self=this;

	var men,
		battle_interval,   // 戰鬥間隔

	men=[];

	var initMen=function(_men){  // _men:[[0,2]]

		for (var i=0;i<3;i++) {
			for (var j=0;j<3;j++) {
				if (_men[i][j]!=-1) {
					var enemy={};
					angular.copy($enemy.getEnemyProto(_men[i][j]),enemy);
					enemy.stand_position_line=i;
					enemy.stand_position_index=j;
					enemy.enemy=true;
					men.push(enemy);
				}
			}
		}

		var players=$player.getFightTeam()

		players.forEach(function(man){
			man.enemy=false;
		})

		men=men.concat(players);

		

		console.log(men)

	}

	var getMen=function(){
		return men;
	}


	var initScene=function (){

		var renderer = PIXI.autoDetectRenderer(900, 700,{backgroundColor : 0x1099bb});
		document.body.appendChild(renderer.view);
		var stage = new PIXI.Container();
		self.getMen().forEach(function(man){

			var container = new PIXI.Container({width:40,height:80});
			// blood line
			var blood_line = new PIXI.Graphics();

			// blood_line.lineStyle(2, 0xFFFFFF, 1);
			blood_line.beginFill(0xFF0000,1);
			blood_line.drawRoundedRect(0, 0, 40, 10, 5);
			blood_line.endFill();
			blood_line.y=10;

			// man body
			var sprite = PIXI.Sprite.fromImage(man.head);
			sprite.width =40;
			sprite.height =40;
			sprite.y=25;
			sprite.x=0;

			// man name
			var basicText = new PIXI.Text(man.name,{font : '12px Arial'});

			// basicText.width=100;
			basicText.x = 20;
			basicText.y = 70;	
			basicText.anchor.x=0.5

			container.addChild(blood_line);
			container.addChild(sprite);
			container.addChild(basicText);

			container.x=man.stand_position_index*100+310;

			if (man.enemy) {
				container.y=(2-man.stand_position_line)*100+10;
			}
			else {
				container.y=610-(2-man.stand_position_line)*100;
			}


			stage.addChild(container);
			man.container=container;

			
			var animate = function () {
				self.getMen().forEach(function(man){

					// console.log(man.container)

					if (man.hp<=0){
						man.container.removeChildren(0,2)
						return;
					}
					else {
						if (man.container) {
							var blood_line=man.container.getChildAt(0)
							var blood_width=man.hp/man.max_hp*40;
							blood_line.width=blood_width;
						}
						
					}
				
				})
			    requestAnimationFrame(animate);
			    renderer.render(stage);
			}

			animate();
		})
	}

	// Start Battle
	var start=function(){
		battle_interval=$interval(function(){
			men.forEach(function(man){
				man.bar_position-=1;
				if (man.bar_position<=0) {
					//暫停  前進
					$interval.cancel(battle_interval);

					//重置速度
					man.bar_position=man.speed;
					
					//選擇最前排的攻擊

					var attack_array=[
						_.filter(men, function(enemy){
							return (enemy.enemy!=man.enemy && enemy.stand_position_line==0 && enemy.hp>0)
						}),
						_.filter(men, function(enemy){
							return (enemy.enemy!=man.enemy && enemy.stand_position_line==1 && enemy.hp>0)
						}),
						_.filter(men, function(enemy){
							return (enemy.enemy==!man.enemy && enemy.stand_position_line==2 && enemy.hp>0)
						})
					]

					var hit_pos=0;

					if (attack_array[0].length!=0){
						hit_pos=0;
					}
					else if (attack_array[1].length!=0) {
						hit_pos=1;
					}
					else if (attack_array[2].length!=0) {
						hit_pos=2;
					}

					// console.log('going to hit enemy at row '+hit_pos);
					// console.log($scope[enemies][hit_pos]);

					var enemy=attack_array[hit_pos][Math.floor(Math.random()*attack_array[hit_pos].length)];

					// console.log(man.name+' is going to attack '+enemy.name)
					if (self.attackMan(man,enemy)) {
						self.start();
					};					
				}
			})
		},100)
	}


	var attackMan=function(from,to){

		// Check critical hit
		if (from.ultimate_stack>=100) {
			var health_lost=from.ultimate_skill.damage_multiplier*from.attack_base;
			to.hp-=health_lost;
			to.ultimate_stack+=25;
			$rootScope.$broadcast('battle_log:update',from.name+'使用了絕招對'+to.name+'造成了'+health_lost+'點傷害');
			from.ultimate_stack=0;
		}
		else {
				//get Attack Points
			var attack_point=from.attack_base+from.attack_dice*(Math.floor(Math.random()*from.attack_variance)+1);

			// get Defense Points
			var defense_point=(to.defense_point*0.006)/(1+0.006*to.defense_point);	

			// Caculate health lost
			var health_lost=attack_point*(1-defense_point);

			// Caculate Miss rate
			var miss_rate=1-from.accuracy_rate*((100-to.evade)/100)/100;

			// Check miss
			if (Math.random()>=miss_rate){

				// Check critical
				if (Math.random()<=(from.critical_rate/100)){
					health_lost=health_lost*((100+from.critical_multiplier)/100);
					$rootScope.$broadcast('battle_log:update',from.name+'對'+to.name+'暴擊了！造成了'+health_lost+'點傷害')
				}
				else {
					$rootScope.$broadcast('battle_log:update',from.name+'對'+to.name+'造成了'+health_lost+'點傷害')
				}

				to.hp-=health_lost;	
				to.ultimate_stack+=25;			
			}
			else {
				$rootScope.$broadcast('battle_log:update',from.name+'攻擊'+to.name+'時miss了');
			}
		}

		// Check Death
		if (to.hp<=0) {
			console.log('an enemy died')
			if (self.manDie(to)){
				console.log('all enemy died')
				return false;
			}
			else {
				console.log('there are enemies left')
				return true;
			}
		}
		else {
			return true;
		}
	}

	var manDie=function(who){

		var enemies=who.enemy ? 'we' : 'enemies';

		var survivors=_.filter(men, function(man){
			return (man.enemy==who.enemy && man.hp>0)
		});

		if (survivors.length==0){
			$interval.cancel(battle_interval);
			return true;
		}		

		return false;
	}


	self={


		initMen:initMen,
		getMen:getMen,

		initScene:initScene,

		start:start,

		// chooseMan:chooseMan,
		attackMan:attackMan,
		// aoeAttackMen:aoeAttackMen,

		manDie:manDie
	}


	return self;
}])