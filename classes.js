class Player {
    constructor(){
        this.body = Bodies.rectangle(0, 200, 35, 60, {
            label: "player",
            render: {
                fillStyle: "blue"
            }
        })
        this.direction = 1
        this.teleport_cooldown = 800
        this.teleport_timer = 0
        this.hp = 3
    }
    update(){
        this.teleport_timer -= 1000/60
        if(this.teleport_timer < 0) this.teleport_timer = 0
        MBody.setAngularVelocity(this.body, 0)
        MBody.setAngle(this.body, 0)
        if(this.teleport_timer > 0) MBody.applyForce(this.body, this.body.position, {x: 0, y: 0.005})
        if(this.body.position.y < -1000) this.hp = 0
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
            this.body.position.x + dir.x*120,
            this.body.position.y + dir.y*120,
            300, 150, {
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
        this.body = Bodies.rectangle(0, 0, 10, 10, {
            label: "enemy",
            isStatic: false,
            render: {
                fillStyle: "red"
            }
        })
        this.body.value = 1
        this.target = Vector.create(0, 0)
        this.speed = 2
    }
    radomize(){
        MBody.scale(this.body, 30/10, 50/10)
        MBody.setPosition(this.body, {x:(Math.floor(Math.random()*2)*2-1)*500+random(-100,100), y: random(50, 100)})
        this.speed = random(1, 3)
    }
    update(player_pos){
        this.target = Vector.create(
            lerp(this.target.x, player_pos.x, 0.05),
            lerp(this.target.y, player_pos.y, 0.05)
        )
        let normalized = Vector.normalise(Vector.sub(this.target, this.body.position))
        normalized.y = 0
        MBody.setVelocity(this.body, Vector.mult(normalized, this.speed))
        MBody.setAngle(this.body, 0)
        MBody.setAngularVelocity(this.body, 0)
    }
}

class Game {
    constructor(){
        this.player = null
        this.enemies = []
        this.platforms = []
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
        this.mouse_down_pos = null
        this.mouse_delta = null
        this.slashes = []
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
    delete_enemy(enemy){
        this.enemies = this.enemies.filter(e => e.body.id != enemy.id)
        Composite.remove(this.engine.world, enemy)
    }
    add_enemy(enemy){
        this.enemies.push(enemy)
        Composite.add(this.engine.world, enemy.body)
    }
    merge_enemies(enemy1, enemy2){
        let new_enemy = new Enemy()
        new_enemy.body.value = enemy1.value + enemy2.value
        new_enemy.speed = (enemy1.speed + enemy2.speed + 1)/3
        MBody.setPosition(new_enemy.body, enemy2.position)
        MBody.scale(new_enemy.body, 30/10 + new_enemy.body.value/3, 50/10 + new_enemy.body.value/3)
        return new_enemy
    }
    collisions(){
        for(let pair of this.engine.pairs.list){
            if(pair.bodyA.label == "player" && pair.bodyB.label == "enemy"){
                this.player.take_damage()
                this.delete_enemy(pair.bodyB)
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "player"){
                this.player.take_damage()
                this.delete_enemy(pair.bodyA)
            }
            if(pair.bodyA.label == "slash" && pair.bodyB.label == "enemy"){
                this.delete_enemy(pair.bodyB)
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "slash"){
                this.delete_enemy(pair.bodyA)
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "enemy"){
                this.add_enemy(this.merge_enemies(pair.bodyA, pair.bodyB))
                this.delete_enemy(pair.bodyA)
                this.delete_enemy(pair.bodyB)
            }
            
        }
        if(this.player.body.position.x < -this.screen_width/2){
            MBody.setPosition(this.player.body, {x: -this.screen_width/2, y: this.player.body.position.y})
            MBody.setVelocity(this.player.body, {x: Math.abs(this.player.body.velocity.x), y: this.player.body.velocity.y})
        }
        if(this.player.body.position.x > this.screen_width/2){
            MBody.setPosition(this.player.body, {x: this.screen_width/2, y: this.player.body.position.y})
            MBody.setVelocity(this.player.body, {x: -Math.abs(this.player.body.velocity.x), y: this.player.body.velocity.y})
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
        if(Vector.magnitude(this.mouse_delta) < 30){
            this.player.teleport(mouse.x-this.screen_width/2,this.screen_height-mouse.y)
        } else {
            let slash = this.player.slash(Vector.normalise(this.mouse_delta))
            this.slashes.push(slash)
            Composite.add(this.engine.world, slash)
            setTimeout(()=>{
                Composite.remove(this.engine.world, slash)
                this.slashes = this.slashes.filter(s => s.id != slash.id)
            }, 300)
        }
        this.mouse_delta = null
    }
    update(){
        this.player.update()
        this.enemies.forEach(e =>e.update(this.player.body.position))
        this.slashes.forEach(s => MBody.setPosition(s,
            Vector.add(
                s.position,
                Vector.sub(this.player.body.position, this.player.body.positionPrev)
            )))
        this.collisions()
        this.handleInput()
    }
    start(){
        this.player = new Player()
        setInterval(()=>{
            let enemy = new Enemy()
            enemy.radomize()
            this.enemies.push(enemy)
            Composite.add(this.engine.world, enemy.body)
        }, 1500)
        this.platforms = [
            Bodies.rectangle(0, 0, 2000, 50, {isStatic: true, render: {fillStyle: "white"}}),
            Bodies.rectangle(300, 320, 200, 25, {isStatic: true, render: {fillStyle: "white"}}),
            Bodies.rectangle(-300, 320, 200, 25, {isStatic: true, render: {fillStyle: "white"}}),
        ]
        Composite.add(this.engine.world, [this.player.body, ...this.platforms])
        Render.run(this.renderer)
        Runner.run(this.runner, this.engine)
        Events.on(this.engine, 'beforeUpdate', this.update.bind(this))
        window.addEventListener('resize', this.resize.bind(this))
        this.resize()
    }
}