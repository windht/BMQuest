angular.module('BMQuest', ['ui.router','BMQuest.battle','BMQuest.level','BMQuest.player']).
controller('MainCtrl', ['$scope','$interval','$rootScope','$battle','$enemy', function($scope,$interval,$rootScope,$battle,$enemy){

	// Battle Logic

	$scope.startBattle=function(){
		$battle.start()
	}

}])


.run(function($enemy,$battle){
	$enemy.initEnemy().then(function(){
		$battle.initMen([
			[0,0,0],
			[-1,1,-1],
			[-1,2,-1]
			]
		)
		$battle.initScene();
	})
	
})