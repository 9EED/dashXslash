let current_game = new Game()
current_game.start()

function loop(){
    if(current_game.player.hp <= 0){
        alert("You died!")
        location.reload()
        return
    }
    G('hud').innerHTML = `
        ${current_game.stage == 1 ? `
            tap to dash, swipe to slash <br>
            survive the longest and get the highest score <br>
            best played on mobile<br>
        `:``}
        Score: ${Math.floor(current_game.score)} <br>
        Stage: ${Math.floor(current_game.stage)} <br>
        HP: ${Math.floor(current_game.player.hp)}
    `
    difficulty_controller(current_game)    
    resetPressed()
    resetMouse()
    requestAnimationFrame(loop)
}
function difficulty_controller(game){
    if(game.score <= 20){
        game.stage = 1
        game.enemy_spawn_rate = 2000
        game.platform_spawn_rate = 1000
        game.max_platforms = 5
        game.platform_max_age = 3000
        game.player.strength = 1
        game.flying_ratio = 0.1
    } else if(game.score <= 50){
        game.stage = 2
        game.enemy_spawn_rate = 1500
        game.platform_spawn_rate = 1500
        game.max_platforms = 4
        game.platform_max_age = 2500
        game.player.strength = 1.2
        game.flying_ratio = 0.2
    } else if(game.score <= 100){
        game.stage = 3
        game.enemy_spawn_rate = 1000
        game.platform_spawn_rate = 2000
        game.max_platforms = 3
        game.platform_max_age = 2500
        game.player.strength = 1.5
        game.flying_ratio = 0.4
    } else if(game.score <= 200){
        game.stage = 4
        game.enemy_spawn_rate = 800
        game.platform_spawn_rate = 3000
        game.max_platforms = 2
        game.platform_max_age = 2000
        game.player.strength = 3
        game.flying_ratio = 0.8
    } else if(game.score <= 300){
        game.stage = 5
        game.enemy_spawn_rate = 500
        game.platform_spawn_rate = 3000
        game.max_platforms = 2
        game.platform_max_age = 1500
        game.player.strength = 3
        game.flying_ratio = 0.6
    } else if(game.score <= 400){
        game.stage = 6
        game.enemy_spawn_rate = 1000
        game.platform_spawn_rate = 2500
        game.max_platforms = 3
        game.platform_max_age = 3000
        game.player.strength = 3.5
        game.flying_ratio = 0.6
    } else if(game.score <= 600){
        game.stage = 7
        game.enemy_spawn_rate = 600
        game.platform_spawn_rate = 2500
        game.max_platforms = 3
        game.platform_max_age = 5000
        game.player.strength = 4
        game.flying_ratio = 0.8
    } else {
        game.stage = Math.ceil(game.score / 100)
    }
}



loop()