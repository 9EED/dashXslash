let random = (min, max) => Math.random()*(max-min)+min
let lerp = (a, b, t) => a + (b-a)*t
let G = id => document.getElementById(id)

const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    MBody = Matter.Body,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Vector = Matter.Vector,
    container = G("container"),
    log = console.log
