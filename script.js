let current_game = new Game()
current_game.start()

function loop(){
    if(current_game.player.hp <= 0){
        alert("You died!")
        location.reload()
        return
    }
    resetPressed()
    resetMouse()
    requestAnimationFrame(loop)
}
loop()