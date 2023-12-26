let current_game = new Game()
current_game.start()

function loop(){

    resetPressed()
    resetMouse()
    requestAnimationFrame(loop)
}
loop()