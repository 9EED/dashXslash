G('container').addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

let down_keys = {}
let pressed_keys = {}
let mouse = {
    x: 0, y: 0,
    dx: 0, dy: 0,
    dz: 0,
    left: false,
    middle: false,
    right: false
}

function isDown(key){
    if(typeof key != 'string') return false
    return down_keys[key.toLowerCase()] ? true : false
}
function wasPressed(key){
    if(typeof key != 'string') return false
    return pressed_keys[key.toLowerCase()] ? true : false
}
let resetPressed = ()=>{pressed_keys = {}}
let resetMouse = ()=>{mouse.dx = 0; mouse.dy = 0; mouse.dz = 0}

document.addEventListener('keydown', (e)=>{
    let key = e.key.toLowerCase()
    if (!down_keys[key]) {
        pressed_keys[key] = true
    }
    down_keys[key] = true
})
document.addEventListener('keyup', (e)=>{
    let key = e.key.toLowerCase()
    down_keys[key] = false
})
document.addEventListener('mousemove', (e)=>{
    mouse.dx = e.movementX
    mouse.dy = e.movementY
    mouse.x = e.clientX
    mouse.y = e.clientY
})
G('container').addEventListener('mousedown', (e)=>{
    if(e.button == 0) mouse.left = true
    if(e.button == 1) mouse.middle = true
    if(e.button == 2) mouse.right = true
})
document.addEventListener('mouseup', (e)=>{
    if(e.button == 0) mouse.left = false
    if(e.button == 1) mouse.middle = false
    if(e.button == 2) mouse.right = false
})
G('container').addEventListener('wheel', (e)=>{
    mouse.dz = e.deltaY
})
G('container').addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    let touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
    mouse.left = true;
});

G('container').addEventListener('touchmove', (e) => {
    e.preventDefault();
    let touch = e.touches[0];
    mouse.dx = touch.clientX - mouse.x;
    mouse.dy = touch.clientY - mouse.y;
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
});

// Handle touch end
G('container').addEventListener('touchend', (e) => {
    e.preventDefault();
    mouse.left = false;
    resetMouse();
});