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
        let normalised = Vector.normalise(delta)
        MBody.setPosition(this.body, {x: x, y: y})
        MBody.setVelocity(this.body, Vector.mult(normalised, 5))
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
    constructor(screen_width, can_fly, position_x, position_y, level, size, hp){
        if(typeof can_fly === "undefined") can_fly = false
        this.can_fly = can_fly
        this.level = level || Math.floor(random(1, 4))
        this.speed = Math.log(this.level) + 2
        if(typeof size !== "undefined") size.x *= random(1.1, 1.3)
        if(typeof size !== "undefined") size.y *= random(1.1, 1.3)
        this.knockback_timer = 0
        this.hp = hp || this.level
        this.size = size || {
            x: this.can_fly ? 35 : random(25, 35),
            y: this.can_fly ? 35 : random(50, 60)
        }
        this.body = Bodies.rectangle(
            position_x || (Math.random() > 0.5 ? -screen_width/2 : screen_width/2),
            position_y || (this.can_fly ? random(100, 800) : random(50, 100)),
            this.size.x,
            this.size.y,
            {
            label: "enemy",
            render: {
                fillStyle: `hsl(${this.level*30 % 360}, 100%, 50%)`
            }
        })
        this.target = Vector.create(0, 100)
    }
    update(player_pos){
        this.knockback_timer -= 1000/60
        if(this.knockback_timer < 0) this.knockback_timer = 0
        this.target = Vector.create(
            lerp(this.target.x, player_pos.x, 0.005 * this.level),
            lerp(this.target.y, player_pos.y, 0.005 * this.level)
        )
        let normalised = Vector.normalise(Vector.sub(this.target, this.body.position))
        if(this.knockback_timer > 0) normalised = Vector.mult(normalised, -4)
        if(!this.can_fly) normalised.y = 0
        if(this.can_fly) MBody.applyForce(this.body, this.body.position, {x: 0, y: 0.0005})
        if(Vector.magnitude(Vector.sub(this.target, this.body.position))) MBody.setVelocity(this.body, Vector.mult(normalised, this.speed))
        MBody.setAngle(this.body, 0)
        MBody.setAngularVelocity(this.body, 0)

    }
    knockback(player_pos){
        if(this.knockback_timer > 0) return 0
        this.knockback_timer = 200
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
        this.flying_ratio = 0.4
        this.merge_chance = 2 // in % per frame
        this.platform_max_age = 2000
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
        let new_enemy = new Enemy(
            this.screen_width,
            enemy1.can_fly || enemy2.can_fly || (random(0, 100) < 20),
            enemy1.body.position.x,
            enemy1.body.position.y,
            enemy1.level + enemy2.level,
            {
                x: (enemy1.size.x + enemy2.size.x + Math.max(enemy1.size.x, enemy2.size.x))/3,
                y: (enemy1.size.y + enemy2.size.y + Math.max(enemy1.size.y, enemy2.size.y))/3
            },
            enemy1.hp + enemy2.hp + 2
        )
        return new_enemy
    }
    break_platform(platform){
        this.platforms = this.platforms.filter(p => p.id != platform.id)
        Composite.remove(this.engine.world, platform)
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
                let enemy = this.enemies.find(e => e.body.id == pair.bodyB.id)
                if(enemy) if (enemy.knockback_timer <= 0) {
                    enemy.knockback(this.player.body.position)
                    enemy.hp -= 1
                }
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "slash"){
                let enemy = this.enemies.find(e => e.body.id == pair.bodyA.id)
                if(enemy) if (enemy.knockback_timer <= 0) {
                    enemy.knockback(this.player.body.position)
                    enemy.hp -= 1
                }
            }
            if(pair.bodyA.label == "enemy" && pair.bodyB.label == "enemy" && random(0, 100) < this.merge_chance){
                let enemy1 = this.enemies.find(e => e.body.id == pair.bodyA.id)
                let enemy2 = this.enemies.find(e => e.body.id == pair.bodyB.id)
                if(enemy1 && enemy2){
                    this.add_enemy(this.merge_enemies(
                        this.enemies.find(e => e.body.id == pair.bodyA.id),
                        this.enemies.find(e => e.body.id == pair.bodyB.id)
                    ))
                    this.delete_enemy(pair.bodyA)
                    this.delete_enemy(pair.bodyB)
                }
            }
            if(pair.bodyA.label == "player" && pair.bodyB.label == "platform") pair.bodyB.age += 1000/60
            if(pair.bodyA.label == "platform" && pair.bodyB.label == "player") pair.bodyA.age += 1000/60
            
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
        this.enemies.forEach(e =>{
            e.update(this.player.body.position)
            if(e.hp <= 0) this.delete_enemy(e.body)
        })
        this.slashes.forEach(s => MBody.setPosition(s, Vector.add(
            s.position,
            Vector.sub(this.player.body.position, this.player.body.positionPrev)
        )))
        this.platforms.forEach(p => {if(p.age > this.platform_max_age) this.break_platform(p)})
        this.collisions()
        this.handleInput()
    }
    start(){
        this.player = new Player()
        setInterval(()=>{
            let enemy = new Enemy(this.screen_width, random(0, 1) < this.flying_ratio)
            this.enemies.push(enemy)
            Composite.add(this.engine.world, enemy.body)
        }, 600)
        setInterval(()=>{
            let platform = Bodies.rectangle(
                random(-this.screen_width/2, this.screen_width/2),
                random(100, this.screen_height-150),
                random(100, 300),
                20,
                {
                    label: "platform",
                    isStatic: true,
                    render: {
                        fillStyle: "#fff"
                    }
                }
            )
            platform.age = 0
            if(this.platforms.length < 3){
                this.platforms.push(platform)
                Composite.add(this.engine.world, platform)
            }
        }, 3000)
        this.floor = Bodies.rectangle(0, 0, 3000, 50, {isStatic: true, render: {fillStyle: "white"}})
        Composite.add(this.engine.world, [this.player.body, this.floor])
        Render.run(this.renderer)
        Runner.run(this.runner, this.engine)
        Events.on(this.engine, 'beforeUpdate', this.update.bind(this))
        window.addEventListener('resize', this.resize.bind(this))
        this.resize()
    }
}