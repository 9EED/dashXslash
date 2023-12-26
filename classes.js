class Player {
    constructor(){
        this.body = Bodies.rectangle(0, 200, 35, 60, {
            label: "player",
            render: {
                fillStyle: "blue"
            }
        })
        this.direction = 1
        this.teleport_cooldown = 500
        this.teleport_timer = 0
        this.hp = 3
    }
    update(){
        this.teleport_timer -= 1000/60
        MBody.setAngularVelocity(this.body, 0)
        MBody.setAngle(this.body, 0)
    }
    teleport(x, y){
        if(this.teleport_timer > 0) return 0
        let delta = Vector.sub({x: x, y: y}, this.body.position)
        let normalized = Vector.normalise(delta)
        MBody.setPosition(this.body, {x: x, y: y})
        MBody.setVelocity(this.body, Vector.mult(normalized, 5))
        this.teleport_timer = this.teleport_cooldown
    }
    slash(dir){
        dir.y = -dir.y
        this.direction = dir.x > 0 ? 1 : -1
        let slash = Bodies.rectangle(
            this.body.position.x + dir.x*100,
            this.body.position.y + dir.y*100,
            230, 110, {
            label: "slash",
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: "#fff3"
            }
        })
        MBody.setAngle(slash,
            Math.atan2(dir.y, dir.x) + (this.direction == 1 ? 0 : Math.PI)
            )
        return slash
    }
    take_damage(){
        this.hp -= 1
    }
}
class Enemy {
    constructor(){
        this.body = Bodies.rectangle(0, 10, 10, 10, {
            label: "enemy",
            isStatic: false,
            render: {
                fillStyle: "red"
            }
        })
        this.target = Vector.create(0, 0)
        this.speed = 1
    }
    radomize(){
        MBody.scale(this.body, 30/10, 50/10)
        MBody.setPosition(this.body, {x:(Math.floor(Math.random()*2)*2-1)*500+random(-100,100), y: random(50, 100)})
    }
    update(player_pos){
        this.target = Vector.create(
            lerp(this.target.x, player_pos.x, 0.05),
            lerp(this.target.y, player_pos.y, 0.05)
        )
        let normalized = Vector.normalise(Vector.sub(this.target, this.body.position))
        MBody.setVelocity(this.body, Vector.mult(normalized, this.speed))
        MBody.setAngle(this.body, 0)
        MBody.setAngularVelocity(this.body, 0)
    }
}

class Game {
    constructor(){
        this.player = null
        this.enemies = null
        this.platforms = null
        this.screen_width = window.innerWidth
        this.screen_height = window.innerHeight
        this.engine = Engine.create({
            positionIterations: 10,
            velocityIterations: 10,
            constraintIterations: 10,
            enableSleeping: false,
            gravity: {x: 0, y: -1, scale: 0.003}
        }),
        this.runner = Runner.create(),
        this.renderer = Render.create({
            element: container,
            engine: this.engine,
            options: {
                width: this.screen_width,
                height: this.screen_height,
                wireframes: false,
                background: 'transparent',
            }
        })
    }
    resize(){
        this.screen_width = window.innerWidth
        this.screen_height = window.innerHeight
        this.renderer.canvas.width = this.screen_width
        this.renderer.canvas.height = this.screen_height
        this.renderer.options.width = this.screen_width
        this.renderer.options.height = this.screen_height
        this.renderer.canvas.style.width = this.screen_width
        this.renderer.canvas.style.height = this.screen_height
        this.renderer.bounds = {
            min: {
                x: -this.screen_width/2,
                y: this.screen_height
            },
            max: {
                x: this.screen_width/2,
                y: 0
            }
        }
        Render.startViewTransform(this.renderer)
    }
    collisions(){
        for(let pair of this.engine.pairs.list){
            if(pair.bodyA.label == "player" && pair.bodyB.label == "enemy"){
                this.player.take_damage()
                this.enemies = this.enemies.filter(e => e.body.id != pair.bodyB.id)
                Composite.remove(this.engine.world, pair.bodyB)
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "player"){
                this.player.take_damage()
                this.enemies = this.enemies.filter(e => e.body.id != pair.bodyA.id)
                Composite.remove(this.engine.world, pair.bodyA)
            }
        }
    }
    mouse_down(){
        if(this.mouse_down_pos) return 0
        this.mouse_down_pos = {x: mouse.x, y: mouse.y}
    }
    mouse_up(){
        if(!this.mouse_down_pos) return 0
        this.mouse_delta = Vector.sub({x: mouse.x, y: mouse.y}, this.mouse_down_pos)
        this.mouse_down_pos = null
    }
    handleInput(){
        if(mouse.left) this.mouse_down()
        if(!mouse.left) this.mouse_up()
        if(!this.mouse_delta) return 0
        if(Vector.magnitude(this.mouse_delta) < 20){
            this.player.teleport(mouse.x-this.screen_width/2,this.screen_height-mouse.y)
        } else {
            let slash = this.player.slash(Vector.normalise(this.mouse_delta))
            Composite.add(this.engine.world, slash)
            setTimeout(()=>{
                Composite.remove(this.engine.world, slash)
            }, 500)
        }
        this.mouse_delta = null
    }
    update(){
        this.player.update()
        this.enemies.forEach(e =>e.update(this.player.body.position))
        this.collisions()
        this.handleInput()
    }
    start(){
        this.player = new Player()
        this.enemies = [new Enemy(), new Enemy(), new Enemy()]
        this.enemies.map(e => e.radomize())
        this.platforms = [
            Bodies.rectangle(0, 0, 2000, 50, {isStatic: true, render: {fillStyle: "white"}}),
        ]
        Composite.add(this.engine.world, [this.player.body, ...this.enemies.map(e => e.body), ...this.platforms])
        Render.run(this.renderer)
        Runner.run(this.runner, this.engine)
        Events.on(this.engine, 'beforeUpdate', this.update.bind(this))
        window.addEventListener('resize', this.resize.bind(this))
        this.resize()
    }
}